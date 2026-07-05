import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const supportedMimeTypes = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg; codecs=opus',
  webm: 'audio/webm',
};

function getExtension(fileName) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function getTrackUrl(fileName) {
  const base = import.meta.env.BASE_URL || '/';
  return encodeURI(`${base}audio/${fileName}`);
}

function canPlayTrack(fileName) {
  if (typeof Audio === 'undefined') {
    return false;
  }

  const mimeType = supportedMimeTypes[getExtension(fileName)];

  if (!mimeType) {
    return false;
  }

  return new Audio().canPlayType(mimeType) !== '';
}

function fadeAudio(audio, from, to, durationMs) {
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

  try {
    audio.currentTime = seconds;
  } catch {
    // Some mobile browsers only allow seeking after metadata is ready.
  }
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
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = 0;
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
      const startAtSeconds = options.startAtSeconds ?? entry.track.startAtSeconds ?? 0;
      const fadeIn = options.fadeIn ?? false;

      if (options.seek ?? true) {
        seekSoftly(audio, startAtSeconds);
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

    seekSoftly(nextEntry.audio, nextEntry.track.startAtSeconds);
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
