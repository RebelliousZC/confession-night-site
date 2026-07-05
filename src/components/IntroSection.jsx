export default function IntroSection({ content }) {
  return (
    <section className="section intro-section" data-reveal>
      <div className="section-inner">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p>
          {content.lines.map((line, index) => (
            <span key={line}>
              {line}
              {index < content.lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
