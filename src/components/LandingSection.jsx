import RippleButton from './RippleButton.jsx';

export default function LandingSection({ content, isOpened, onOpenNight }) {
  return (
    <section className="section landing-section" data-reveal>
      <div className="section-inner landing-inner">
        <div className="quiet-moon" aria-hidden="true" />
        <h1>{content.title}</h1>
        <p className="landing-subtitle">{content.subtitle}</p>

        <RippleButton className="open-night-button" onClick={onOpenNight}>
          {isOpened ? content.openedPrompt : content.openPrompt}
        </RippleButton>
      </div>
    </section>
  );
}
