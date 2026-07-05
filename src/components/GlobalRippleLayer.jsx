import { useEffect, useRef, useState } from 'react';

export default function GlobalRippleLayer() {
  const [ripples, setRipples] = useState([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (event.pointerType !== 'mouse' && !event.isPrimary) {
        return;
      }

      const viewport = Math.max(window.innerWidth, window.innerHeight);
      const ripple = {
        id: nextIdRef.current,
        x: event.clientX,
        y: event.clientY,
        size: Math.min(240, Math.max(132, viewport * 0.28)),
      };

      nextIdRef.current += 1;
      setRipples((current) => [...current.slice(-5), ripple]);

      const timeout = window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, 1500);

      timeoutsRef.current.push(timeout);
    };

    window.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  return (
    <div className="global-ripple-layer" aria-hidden="true">
      {ripples.map((ripple) => (
        <span
          className="global-ripple"
          key={ripple.id}
          style={{
            '--global-ripple-x': `${ripple.x}px`,
            '--global-ripple-y': `${ripple.y}px`,
            '--global-ripple-size': `${ripple.size}px`,
          }}
        />
      ))}
    </div>
  );
}
