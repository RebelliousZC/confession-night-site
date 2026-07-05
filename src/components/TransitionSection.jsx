export default function TransitionSection({ title, paragraphs, tone = 0 }) {
  return (
    <section className={`section transition-section transition-tone-${tone}`} data-reveal>
      <div className="section-inner">
        <h2>{title}</h2>
        <div className="transition-copy">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
