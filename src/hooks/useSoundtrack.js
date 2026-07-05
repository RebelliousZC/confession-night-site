import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const supportedMimeTypes = {
  mp3: ['audio/mpeg'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  mp4: ['audio/mp4'],
  aac: ['audio/aac', 'audio/mp4', 'audio/x-m4a'],
  wav: ['audio/wav'],
  ogg: ['audio/ogg'],
  oga: ['audio/ogg'],
  opus: ['audio/ogg; codecs=opus'],
  webm: ['audio/webm'],
};

function getExtension(fileName) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function getTrackUrl(fileName) {
  const base = import.meta.env.BASE_URL || '/';
  return encodeURI(`${base}audio/${fileName}`);
}

function getTrackStartAt(track) {
  return track.startAt ?? 0;
}

function getTrackLoopStart(track) {
  return track.loopStart ?? getTrackStartAt(track);
}

function clampVolume(volume) {
  return Math.min(1, Math.max(0, volume));
}

function canProbablyPlay(fileName) {
  if (typeof Audio === 'undefined') {
    return true;
  }

  const mimeTypes = supportedMimeTypes[getExtension(fileName)];

  if (!mimeTypes) {
    return true;
  }

  const probe = new Audio();
  return mimeTypes.some((mimeType) => probe.canPlayType(mimeType) !== '');
}

function getAudioErrorMessage(audio, fallback) {
  if (!audio?.error) {
    return fallback;
  }

  const errorNames = {
    1: 'aborted',
    2: 'network-error',
    3: 'decode-error',
    4: 'unsupported-source',
  };

  return errorNames[audio.error.code] ?? fallback;
}

function getPlayRejectionMessage(error, fallback) {
  if (!error) {
    return fallback;
  }

  const name = error.name || 'PlayError';
  const message = error.message ? `: ${error.message}` : '';
  return `${name}${message}`;
}

function getEntryLoopEnd(entry) {
  if (!entry?.track.shouldLoop) {
    entry.loopEnd = null;
    return null;
  }

  const trimEndSeconds = entry.track.trimEndSeconds ?? 0;
  const duration = entry.audio.duration;
  const loopStart = getTrackLoopStart(entry.track);

  if (
    trimEndSeconds <= 0 ||
    !Number.isFinite(duration) ||
    duration <= trimEndSeconds ||
    duration - trimEndSeconds <= loopStart
  ) {
    entry.loopEnd = null;
    return null;
  }

  entry.loopEnd = duration - trimEndSeconds;
  return entry.loopEnd;
}

function fadeAudio(audio, from, to, durationMs) {
  const startVolume = clampVolume(from);
  const endVolume = clampVolume(to);

  if (durationMs <= 0 || typeof window === 'undefined') {
    audio.volume = endVolume;
    return Promise.resolve();
  }

  const start = performance.now();
  audio.volume = startVolume;

  return new Promise((resolve) => {
    const step = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      audio.volume = startVolume + (endVolume - startVolume) * progress;

      if (progress < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      audio.volume = endVolume;
      resolve();
    };

    window.requestAnimationFrame(step);
  });
}

function seekAudio(audio, seconds) {
  const nextTime = Math.max(0, seconds ?? 0);

  const applySeek = () => {
    try {
      audio.currentTime = nextTime;
      return true;
    } catch {
      return false;
    }
  };

  if (audio.readyState >= 1 || nextTime === 0) {
    return applySeek();
  }

  audio.addEventListener('loadedmetadata', applySeek, { once: true });
  return false;
}

function createDebugState() {
  return {
    activated: false,
    currentTrack: 'opening',
    isPlaying: false,
    currentTime: 0,
    duration: null,
    loopEnd: null,
    src: '',
    lastError: '',
  };
}

export function useSoundtrack(musicConfig) {
  const targetVolume = clampVolume(musicConfig.volume ?? 0.25);
  const crossfadeMs = musicConfig.crossfadeMs ?? 2400;
  const tracks = musicConfig.tracks;
  const trackEntries = useMemo(() => Object.entries(tracks), [tracks]);
  const trackRefs = useRef(new Map());
  const currentKeyRef = useRef('opening');
  const isPlayingRef = useRef(false);
  const isActivatedRef = useRef(false);
  const hasSwitchedToConfessionRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [currentKey, setCurrentKey] = useState('opening');
  const [debugState, setDebugState] = useState(createDebugState);

  const publishDebugState = useCallback(() => {
    const entry = trackRefs.current.get(currentKeyRef.current);
    const audio = entry?.audio;
    const loopEnd = entry ? getEntryLoopEnd(entry) : null;

    setDebugState({
      activated: isActivatedRef.current,
      currentTrack: currentKeyRef.current,
      isPlaying: isPlayingRef.current,
      currentTime: Number.isFinite(audio?.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio?.duration) ? audio.duration : null,
      loopEnd,
      src: entry?.src ?? '',
      lastError: entry?.lastError ?? '',
    });
  }, []);

  const setCurrentTrackAvailability = useCallback(
    (key) => {
      const entry = trackRefs.current.get(key);
      setIsUnavailable(Boolean(entry?.lastError && entry.available === false));
      publishDebugState();
    },
    [publishDebugState],
  );

  const stopLoopWatcher = useCallback((entry) => {
    if (entry?.rafId) {
      window.cancelAnimationFrame(entry.rafId);
      entry.rafId = null;
    }
  }, []);

  const restartLoop = useCallback(
    async (entry) => {
      if (!entry?.track.shouldLoop || entry.isLoopSeeking) {
        return false;
      }

      entry.isLoopSeeking = true;
      const loopStart = getTrackLoopStart(entry.track);
      seekAudio(entry.audio, loopStart);

      if (currentKeyRef.current === entry.key && isPlayingRef.current) {
        try {
          await entry.audio.play();
          entry.hasStarted = true;
          entry.lastError = '';
          entry.available = true;
        } catch (error) {
          entry.lastError = getPlayRejectionMessage(error, 'loop-replay-blocked');
        }
      }

      window.setTimeout(() => {
        entry.isLoopSeeking = false;
      }, 240);

      publishDebugState();
      return true;
    },
    [publishDebugState],
  );

  const enforceLoop = useCallback(
    (entry) => {
      if (!entry?.track.shouldLoop) {
        return false;
      }

      const loopEnd = getEntryLoopEnd(entry);

      if (loopEnd === null) {
        return false;
      }

      if (entry.audio.currentTime >= loopEnd) {
        void restartLoop(entry);
        return true;
      }

      return false;
    },
    [restartLoop],
  );

  const startLoopWatcher = useCallback(
    (entry) => {
      if (!entry?.track.shouldLoop || entry.rafId) {
        return;
      }

      const tick = () => {
        if (
          currentKeyRef.current !== entry.key ||
          !isPlayingRef.current ||
          entry.audio.paused
        ) {
          entry.rafId = null;
          return;
        }

        enforceLoop(entry);
        entry.rafId = window.requestAnimationFrame(tick);
      };

      entry.rafId = window.requestAnimationFrame(tick);
    },
    [enforceLoop],
  );

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return undefined;
    }

    const prepared = trackEntries.map(([key, track]) => {
      const src = getTrackUrl(track.fileName);
      const audio = new Audio(src);
      const entry = {
        audio,
        available: true,
        hasStarted: false,
        isLoopSeeking: false,
        key,
        lastError: canProbablyPlay(track.fileName) ? '' : 'maybe-unsupported-format',
        loopEnd: null,
        rafId: null,
        src,
        track,
      };

      audio.loop = false;
      audio.preload = 'auto';
      audio.volume = 0;

      const updateLoopEnd = () => {
        getEntryLoopEnd(entry);
        publishDebugState();
      };

      const handleProgress = () => {
        enforceLoop(entry);
        publishDebugState();
      };

      const handleEnded = () => {
        if (entry.track.shouldLoop) {
          void restartLoop(entry);
          return;
        }

        if (currentKeyRef.current === key) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          stopLoopWatcher(entry);
          publishDebugState();
        }
      };

      const handleError = () => {
        entry.available = false;
        entry.lastError = getAudioErrorMessage(audio, 'audio-error');

        if (currentKeyRef.current === key) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsUnavailable(true);
        }

        stopLoopWatcher(entry);
        publishDebugState();
      };

      audio.addEventListener('loadedmetadata', updateLoopEnd);
      audio.addEventListener('durationchange', updateLoopEnd);
      audio.addEventListener('timeupdate', handleProgress);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return [key, entry];
    });

    trackRefs.current = new Map(prepared);
    setCurrentTrackAvailability(currentKeyRef.current);
    publishDebugState();

    return () => {
      trackRefs.current.forEach((entry) => {
        stopLoopWatcher(entry);
        entry.audio.pause();
        entry.audio.removeAttribute('src');
        entry.audio.load();
      });
      trackRefs.current.clear();
    };
  }, [
    enforceLoop,
    publishDebugState,
    restartLoop,
    setCurrentTrackAvailability,
    stopLoopWatcher,
    trackEntries,
  ]);

  const pause = useCallback(() => {
    trackRefs.current.forEach((entry) => {
      entry.audio.pause();
      stopLoopWatcher(entry);
    });

    isPlayingRef.current = false;
    setIsPlaying(false);
    publishDebugState();
  }, [publishDebugState, stopLoopWatcher]);

  const playTrack = useCallback(
    async (key, options = {}) => {
      const entry = trackRefs.current.get(key);

      currentKeyRef.current = key;
      setCurrentKey(key);

      if (!entry?.audio) {
        setIsUnavailable(true);
        isPlayingRef.current = false;
        setIsPlaying(false);
        publishDebugState();
        return false;
      }

      const audio = entry.audio;
      const shouldSeek = options.seek ?? !entry.hasStarted;
      const startAt = options.startAt ?? getTrackStartAt(entry.track);

      if (shouldSeek) {
        seekAudio(audio, startAt);
      }

      audio.volume = options.fadeIn ? 0 : targetVolume;

      try {
        await audio.play();

        trackRefs.current.forEach((otherEntry, otherKey) => {
          if (otherKey !== key && !options.keepOthersPlaying) {
            otherEntry.audio.pause();
            otherEntry.audio.volume = 0;
            stopLoopWatcher(otherEntry);
          }
        });

        entry.available = true;
        entry.hasStarted = true;
        entry.lastError = '';
        currentKeyRef.current = key;
        setCurrentKey(key);
        setIsUnavailable(false);
        isPlayingRef.current = true;
        setIsPlaying(true);
        startLoopWatcher(entry);

        if (options.fadeIn) {
          await fadeAudio(audio, 0, targetVolume, options.durationMs ?? crossfadeMs);
        }

        publishDebugState();
        return true;
      } catch (error) {
        entry.lastError =
          audio.error ? getAudioErrorMessage(audio, 'play-blocked-or-failed') : getPlayRejectionMessage(error, 'play-blocked-or-failed');
        entry.available = !audio.error;
        setIsUnavailable(Boolean(audio.error));
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopLoopWatcher(entry);
        publishDebugState();
        return false;
      }
    },
    [crossfadeMs, publishDebugState, startLoopWatcher, stopLoopWatcher, targetVolume],
  );

  const play = useCallback(async () => {
    isActivatedRef.current = true;
    publishDebugState();
    return playTrack(currentKeyRef.current);
  }, [playTrack, publishDebugState]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
      return;
    }

    void play();
  }, [pause, play]);

  const switchToConfessionTrack = useCallback(async () => {
    if (hasSwitchedToConfessionRef.current) {
      return;
    }

    hasSwitchedToConfessionRef.current = true;
    const previousEntry = trackRefs.current.get(currentKeyRef.current);
    const nextKey = 'confession';
    const nextEntry = trackRefs.current.get(nextKey);

    currentKeyRef.current = nextKey;
    setCurrentKey(nextKey);
    setCurrentTrackAvailability(nextKey);

    if (!nextEntry?.audio) {
      setIsUnavailable(true);
      publishDebugState();
      return;
    }

    if (!isActivatedRef.current) {
      publishDebugState();
      return;
    }

    seekAudio(nextEntry.audio, getTrackStartAt(nextEntry.track));
    nextEntry.audio.volume = 0;

    if (!isPlayingRef.current || !previousEntry?.audio || previousEntry.key === nextKey) {
      await playTrack(nextKey, { seek: true });
      return;
    }

    try {
      await nextEntry.audio.play();
    } catch (error) {
      nextEntry.lastError =
        nextEntry.audio.error ? getAudioErrorMessage(nextEntry.audio, 'confession-play-failed') : getPlayRejectionMessage(error, 'confession-play-failed');
      setIsUnavailable(Boolean(nextEntry.audio.error));
      publishDebugState();
      return;
    }

    nextEntry.available = true;
    nextEntry.hasStarted = true;
    nextEntry.lastError = '';
    currentKeyRef.current = nextKey;
    setCurrentKey(nextKey);
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsUnavailable(false);
    stopLoopWatcher(previousEntry);

    await Promise.all([
      fadeAudio(previousEntry.audio, previousEntry.audio.volume, 0, crossfadeMs).then(() => {
        previousEntry.audio.pause();
        previousEntry.audio.volume = 0;
      }),
      fadeAudio(nextEntry.audio, 0, targetVolume, crossfadeMs),
    ]);

    publishDebugState();
  }, [
    crossfadeMs,
    playTrack,
    publishDebugState,
    setCurrentTrackAvailability,
    stopLoopWatcher,
    targetVolume,
  ]);

  return {
    currentTrackLabel: tracks[currentKey]?.label ?? '',
    debugState,
    isPlaying,
    isUnavailable,
    play,
    switchToConfessionTrack,
    toggle,
  };
}
