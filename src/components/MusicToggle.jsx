export default function MusicToggle({ content, currentTrackLabel, isPlaying, isUnavailable, onToggle }) {
  const label = isUnavailable
    ? content.unavailable
    : isPlaying
      ? `${content.pausePrefix}${currentTrackLabel}`
      : `${content.playPrefix}${currentTrackLabel}`;

  return (
    <button
      className={`music-toggle ${isPlaying ? 'is-playing' : ''}`}
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      ♪
    </button>
  );
}
