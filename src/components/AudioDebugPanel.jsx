function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

export default function AudioDebugPanel({ state }) {
  if (!state) {
    return null;
  }

  return (
    <aside className="audio-debug-panel" aria-label="Audio debug panel">
      <strong>audio debug</strong>
      <dl>
        <div>
          <dt>activated</dt>
          <dd>{String(state.activated)}</dd>
        </div>
        <div>
          <dt>currentTrack</dt>
          <dd>{state.currentTrack}</dd>
        </div>
        <div>
          <dt>isPlaying</dt>
          <dd>{String(state.isPlaying)}</dd>
        </div>
        <div>
          <dt>currentTime</dt>
          <dd>{formatNumber(state.currentTime)}</dd>
        </div>
        <div>
          <dt>duration</dt>
          <dd>{formatNumber(state.duration)}</dd>
        </div>
        <div>
          <dt>loopEnd</dt>
          <dd>{formatNumber(state.loopEnd)}</dd>
        </div>
        <div>
          <dt>src</dt>
          <dd>{state.src || 'n/a'}</dd>
        </div>
        <div>
          <dt>lastError</dt>
          <dd>{state.lastError || 'none'}</dd>
        </div>
      </dl>
    </aside>
  );
}
