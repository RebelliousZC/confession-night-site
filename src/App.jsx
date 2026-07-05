import { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundAtmosphere from './components/BackgroundAtmosphere.jsx';
import ConfessionSection from './components/ConfessionSection.jsx';
import FinalSection from './components/FinalSection.jsx';
import IntroSection from './components/IntroSection.jsx';
import LandingSection from './components/LandingSection.jsx';
import MusicToggle from './components/MusicToggle.jsx';
import TimelineSection from './components/TimelineSection.jsx';
import TransitionSection from './components/TransitionSection.jsx';
import { siteContent } from './content/siteContent.js';
import { useSoundtrack } from './hooks/useSoundtrack.js';

function useRevealOnScroll() {
  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((target) => target.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);
}

function useConfessionSignals(onEnterConfession) {
  const hasVibratedRef = useRef(false);
  const hasEnteredRef = useRef(false);
  const onEnterConfessionRef = useRef(onEnterConfession);

  useEffect(() => {
    onEnterConfessionRef.current = onEnterConfession;
  }, [onEnterConfession]);

  useEffect(() => {
    const confession = document.getElementById('confession');

    if (!confession) {
      return undefined;
    }

    const activate = () => {
      if (!hasEnteredRef.current) {
        hasEnteredRef.current = true;
        onEnterConfessionRef.current?.();
      }

      if (!hasVibratedRef.current) {
        hasVibratedRef.current = true;

        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(20);
          } catch {
            // Some browsers expose vibrate but silently disallow it.
          }
        }
      }
    };

    const updateGlow = () => {
      const rect = confession.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isActive = rect.top < viewportHeight * 0.72 && rect.bottom > viewportHeight * 0.28;

      document.body.classList.toggle('confession-glow', isActive);

      if (isActive) {
        activate();
      }
    };

    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                activate();
              }

              updateGlow();
            },
            {
              threshold: [0, 0.08, 0.2],
              rootMargin: '-12% 0px -12% 0px',
            },
          )
        : null;

    observer?.observe(confession);
    window.addEventListener('scroll', updateGlow, { passive: true });
    window.addEventListener('resize', updateGlow);
    window.requestAnimationFrame(updateGlow);

    return () => {
      document.body.classList.remove('confession-glow');
      window.removeEventListener('scroll', updateGlow);
      window.removeEventListener('resize', updateGlow);
      observer?.disconnect();
    };
  }, []);
}

export default function App() {
  const [nightOpened, setNightOpened] = useState(false);
  const soundtrack = useSoundtrack(siteContent.music);

  useRevealOnScroll();
  useConfessionSignals(soundtrack.switchToConfessionTrack);

  const openNight = useCallback(() => {
    setNightOpened(true);
    soundtrack.play();
  }, [soundtrack]);

  return (
    <div className="app" data-night-opened={nightOpened}>
      <BackgroundAtmosphere />
      <MusicToggle
        currentTrackLabel={soundtrack.currentTrackLabel}
        isPlaying={soundtrack.isPlaying}
        isUnavailable={soundtrack.isUnavailable}
        onToggle={soundtrack.toggle}
      />

      <main>
        <LandingSection
          content={siteContent.landing}
          isOpened={nightOpened}
          onOpenNight={openNight}
        />
        <IntroSection content={siteContent.intro} />
        <TimelineSection content={siteContent.timeline} />

        {siteContent.transitions.map((section, index) => (
          <TransitionSection
            key={section.title}
            title={section.title}
            paragraphs={section.paragraphs}
            tone={index}
          />
        ))}

        <ConfessionSection content={siteContent.confession} />
        <FinalSection content={siteContent.final} />
      </main>
    </div>
  );
}
