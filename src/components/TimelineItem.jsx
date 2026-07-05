import { useState } from 'react';

export default function TimelineItem({ date, title, detail }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="timeline-item" data-reveal>
      <button
        className={`timeline-trigger ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="timeline-date">{date}</span>
        <span className="timeline-title">{title}</span>
        <span className="timeline-plus" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <div className={`timeline-detail ${isOpen ? 'is-open' : ''}`}>
        <div className="timeline-detail-inner">
          <p>{detail}</p>
        </div>
      </div>
    </li>
  );
}
