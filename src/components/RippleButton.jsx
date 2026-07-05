import { useRef, useState } from 'react';

export default function RippleButton({ children, className = '', onClick, ...props }) {
  const [ripples, setRipples] = useState([]);
  const nextIdRef = useRef(0);

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const ripple = {
      id: nextIdRef.current,
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
      size,
    };

    nextIdRef.current += 1;
    setRipples((current) => [...current, ripple]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id));
    }, 900);

    onClick?.(event);
  };

  return (
    <button
      className={`ripple-button ${className}`}
      type="button"
      onClick={handleClick}
      {...props}
    >
      <span className="ripple-button-label">{children}</span>
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className="button-ripple"
          key={ripple.id}
          style={{
            '--ripple-x': `${ripple.x}px`,
            '--ripple-y': `${ripple.y}px`,
            '--ripple-size': `${ripple.size}px`,
          }}
        />
      ))}
    </button>
  );
}
