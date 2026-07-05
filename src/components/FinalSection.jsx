import { useState } from 'react';
import RippleButton from './RippleButton.jsx';

export default function FinalSection({ content }) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <section className="section final-section" id="final" data-reveal>
      <div className="section-inner final-inner">
        <RippleButton className="final-button" onClick={() => setIsRevealed(true)}>
          {content.button}
        </RippleButton>

        <div
          className={`final-message ${isRevealed ? 'is-revealed' : ''}`}
          aria-live="polite"
        >
          {isRevealed && (
            <>
              {content.message.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
