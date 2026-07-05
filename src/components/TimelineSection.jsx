import TimelineItem from './TimelineItem.jsx';

export default function TimelineSection({ content }) {
  return (
    <section className="section timeline-section">
      <div className="section-inner">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2 data-reveal>{content.title}</h2>
        <ol className="timeline-list">
          {content.items.map((item) => (
            <TimelineItem key={`${item.date}-${item.title}`} {...item} />
          ))}
        </ol>
      </div>
    </section>
  );
}
