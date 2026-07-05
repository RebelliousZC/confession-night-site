import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const supportedMimeTypes = {
  mp3: ['audio/mpeg'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  mp4: ['audio/mp4'],
  aac: ['audio/aac', 'audio/mp4', 'audio/x-m4a'],
  acc: ['audio/aac', 'audio/mp4', 'audio/x-m4a'],
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

function getTrimmedLoopEnd(audio, track) {
  const trimEndSeconds = track.trimEndSeconds ?? 0;
  const loopStart = getTrackLoopStart(track);

  if (
    trimEndSeconds <= 0 ||
    !Number.isFinite(audio.duration) ||
    audio.duration <= trimEndSeconds
  ) {
    return null;
  }

  const loopEnd = audio.duration - trimEndSeconds;
  return loopEnd > loopStart + 1 ? loopEnd : null;
}

function canPlayTrack(fileName) {
  if (typeof Audio === 'undefined') {
    return false;
  }

  const mimeTypes = supportedMimeTypes[getExtension(fileName)];

  if (!mimeTypes) {
    return false;
  }

  const probe = new Audio();
  return mimeTypes.some((mimeType) => probe.canPlayType(mimeType) !== '');
}

function fadeAudio(audio, from, to, durationMs) {
  if (durationMs <= 0) {
    audio.volume = to;
    return Promise.resolve();
  }

  const start = performance.now();
  audio.volume = from;

  return new Promise((resolve) => {
    const step = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      audio.volume = from + (to - from) * progress;

      if (progress < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      resolve();
    };

    window.requestAnimationFrame(step);
  });
}

function seekSoftly(audio, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  const applySeek = () => {
    try {
      audio.currentTime = seconds;
    } catch {
      // Some mobile browsers only allow seeking after metadata is ready.
    }
  };

  if (audio.readyState >= 1) {
    applySeek();
    return;
  }

  audio.addEventListener('loadedmetadata', applySeek, { once: true });
}

export function useSoundtrack(musicConfig) {
  const targetVolume = musicConfig.volume ?? 0.18;
  const crossfadeMs = musicConfig.crossfadeMs ?? 2200;
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

  const setCurrentTrackAvailability = useCallback((key) => {
    const entry = trackRefs.current.get(key);
    setIsUnavailable(!entry?.available);
  }, []);

  useEffect(() => {
    let disposed = false;
    const controllers = [];

    const prepare = async () => {
      const prepared = await Promise.all(
        trackEntries.map(async ([key, track]) => {
          if (!canPlayTrack(track.fileName)) {
            return [key, { available: false, reason: 'unsupported-format', track }];
          }

          const controller = new AbortController();
          controllers.push(controller);

          try {
            const response = await fetch(getTrackUrl(track.fileName), {
              method: 'HEAD',
              cache: 'no-store',
              signal: controller.signal,
            });

            if (!response.ok) {
              return [key, { available: false, reason: 'missing-file', track }];
            }

            const audio = new Audio(getTrackUrl(track.fileName));
            audio.loop = false;
            audio.preload = 'auto';
            audio.volume = 0;
            let loopEnd = null;
            let isSoftLooping = false;

            const updateLoopEnd = () => {
              loopEnd = getTrimmedLoopEnd(audio, track);
            };

            const softlyRestartTrimmedLoop = async () => {
              if (
                isSoftLooping ||
                audio.paused ||
                currentKeyRef.current !== key ||
                !isPlayingRef.current
              ) {
                return;
              }

              isSoftLooping = true;

              try {
                const loopStart = getTrackLoopStart(track);
                const quietVolume = Math.min(audio.volume, targetVolume) * 0.16;
                await fadeAudio(audio, audio.volume, quietVolume, 420);
                seekSoftly(audio, loopStart);

                if (!audio.paused) {
                  await audio.play();
                }

                await fadeAudio(audio, audio.volume, targetVolume, 780);
              } catch {
                seekSoftly(audio, getTrackLoopStart(track));
              } finally {
                isSoftLooping = false;
              }
            };

            const handleTimeUpdate = () => {
              if (!loopEnd) {
                updateLoopEnd();
              }

              if (loopEnd && audio.currentTime >= loopEnd) {
                void softlyRestartTrimmedLoop();
              }
            };

            audio.addEventListener('loadedmetadata', updateLoopEnd);
            audio.addEventListener('durationchange', updateLoopEnd);
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', () => {
              if (currentKeyRef.current === key) {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }
            });
            audio.addEventListener('error', () => {
              const current = trackRefs.current.get(key);
              trackRefs.current.set(key, { ...current, available: false });

              if (currentKeyRef.current === key) {
                setIsUnavailable(true);
                setIsPlaying(false);
                isPlayingRef.current = false;
              }
            });

            return [key, { audio, available: true, track }];
          } catch (error) {
            if (error.name === 'AbortError') {
              return [key, { available: false, reason: 'aborted', track }];
            }

            return [key, { available: false, reason: 'unavailable', track }];
          }
        }),
      );

      if (disposed) {
        return;
      }

      trackRefs.current = new Map(prepared);
      setCurrentTrackAvailability(currentKeyRef.current);
    };

    prepare();

    return () => {
      disposed = true;
      controllers.forEach((controller) => controller.abort());
      trackRefs.current.forEach((entry) => {
        entry.audio?.pause();
      });
      trackRefs.current.clear();
    };
  }, [setCurrentTrackAvailability, trackEntries]);

  const playTrack = useCallback(
    async (key, options = {}) => {
      const entry = trackRefs.current.get(key);

      if (!entry?.available || !entry.audio) {
        currentKeyRef.current = key;
        setCurrentKey(key);
        setIsUnavailable(true);
        setIsPlaying(false);
        isPlayingRef.current = false;
        return false;
      }

      const audio = entry.audio;
      const startAt = options.startAt ?? getTrackStartAt(entry.track);
      const fadeIn = options.fadeIn ?? false;

      if (options.seek ?? true) {
        seekSoftly(audio, startAt);
      }

      audio.volume = fadeIn ? 0 : targetVolume;

      try {
        await audio.play();

        currentKeyRef.current = key;
        setCurrentKey(key);
        setIsUnavailable(false);
        setIsPlaying(true);
        isPlayingRef.current = true;

        if (fadeIn) {
          await fadeAudio(audio, 0, targetVolume, options.durationMs ?? crossfadeMs);
        }

        return true;
      } catch {
        setIsPlaying(false);
        isPlayingRef.current = false;

        if (audio.error) {
          setIsUnavailable(true);
        }

        return false;
      }
    },
    [crossfadeMs, targetVolume],
  );

  const play = useCallback(async () => {
    isActivatedRef.current = true;
    return playTrack(currentKeyRef.current, { seek: false });
  }, [playTrack]);

  const pause = useCallback(() => {
    trackRefs.current.forEach((entry) => {
      entry.audio?.pause();
    });

    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
      return;
    }

    play();
  }, [pause, play]);

  const switchToConfessionTrack = useCallback(async () => {
    if (hasSwitchedToConfessionRef.current) {
      return;
    }

    hasSwitchedToConfessionRef.current = true;
    const nextKey = 'confession';
    const previousEntry = trackRefs.current.get(currentKeyRef.current);
    const nextEntry = trackRefs.current.get(nextKey);

    currentKeyRef.current = nextKey;
    setCurrentKey(nextKey);
    setCurrentTrackAvailability(nextKey);

    if (!isActivatedRef.current || !isPlayingRef.current || !nextEntry?.available || !nextEntry.audio) {
      return;
    }

    seekSoftly(nextEntry.audio, getTrackStartAt(nextEntry.track));
    nextEntry.audio.volume = 0;

    try {
      await nextEntry.audio.play();
    } catch {
      setIsUnavailable(Boolean(nextEntry.audio?.error));
      return;
    }

    const fadeOut = previousEntry?.audio
      ? fadeAudio(previousEntry.audio, previousEntry.audio.volume, 0, crossfadeMs).then(() => {
          previousEntry.audio.pause();
        })
      : Promise.resolve();
    const fadeIn = fadeAudio(nextEntry.audio, 0, targetVolume, crossfadeMs);

    await Promise.all([fadeOut, fadeIn]);
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsUnavailable(false);
  }, [crossfadeMs, setCurrentTrackAvailability, targetVolume]);

  return {
    currentTrackLabel: tracks[currentKey]?.label ?? '',
    isPlaying,
    isUnavailable,
    play,
    switchToConfessionTrack,
    toggle,
  };
}
