export default function ConfessionSection({ content }) {
  return (
    <section className="section confession-section" id="confession" data-reveal>
      <div className="section-inner confession-inner">
        {content.paragraphs.map((paragraph, paragraphIndex) => (
          <p
            className={
             paragraph.variant ? `confession-${paragraph.variant}` : undefined
            }
            key={`${paragraph.variant ?? 'copy'}-${paragraphIndex}`}
          >
            {paragraph.lines.map((line, lineIndex) => (
              <span key={line}>
                {line}
                {lineIndex < paragraph.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
