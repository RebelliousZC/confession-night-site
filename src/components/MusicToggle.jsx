export default function MusicToggle({ currentTrackLabel, isPlaying, isUnavailable, onToggle }) {
  const label = isUnavailable
    ? '背景音乐格式不支持或未放置'
    : isPlaying
      ? `暂停背景音乐：${currentTrackLabel}`
      : `播放背景音乐：${currentTrackLabel}`;

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
