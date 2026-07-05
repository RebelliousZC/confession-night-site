const lightParticles = [
  { left: '9%', top: '14%', size: 2, blur: 8, delay: '-2s', duration: '24s' },
  { left: '23%', top: '31%', size: 1, blur: 7, delay: '-11s', duration: '30s' },
  { left: '41%', top: '12%', size: 2, blur: 9, delay: '-17s', duration: '28s' },
  { left: '58%', top: '26%', size: 1, blur: 7, delay: '-6s', duration: '26s' },
  { left: '72%', top: '17%', size: 2, blur: 10, delay: '-9s', duration: '32s' },
  { left: '86%', top: '35%', size: 1, blur: 8, delay: '-13s', duration: '29s' },
  { left: '16%', top: '62%', size: 2, blur: 11, delay: '-4s', duration: '33s' },
  { left: '51%', top: '68%', size: 1, blur: 7, delay: '-15s', duration: '27s' },
  { left: '77%', top: '58%', size: 2, blur: 10, delay: '-20s', duration: '31s' },
  { left: '91%', top: '74%', size: 1, blur: 8, delay: '-7s', duration: '25s' },
  { left: '33%', top: '84%', size: 2, blur: 13, delay: '-18s', duration: '36s' },
  { left: '64%', top: '91%', size: 1, blur: 10, delay: '-25s', duration: '34s' },
];

const codeParticles = [
  { text: 'const', left: '12%', top: '43%', delay: '-4s', duration: '36s' },
  { text: '{ }', left: '68%', top: '46%', delay: '-16s', duration: '42s' },
  { text: 'moon', left: '79%', top: '22%', delay: '-22s', duration: '40s' },
  { text: '< >', left: '28%', top: '72%', delay: '-11s', duration: '38s' },
  { text: 'lake', left: '63%', top: '82%', delay: '-27s', duration: '44s' },
];

export default function BackgroundAtmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="moon-disk" />
      <div className="moon-haze" />
      <div className="distant-shore" />
      <div className="lake-sheen" />
      <div className="lower-mist" />

      {lightParticles.map((particle, index) => (
        <span
          className="particle"
          key={`particle-${index}`}
          style={{
            '--left': particle.left,
            '--top': particle.top,
            '--size': `${particle.size}px`,
            '--blur': `${particle.blur}px`,
            '--delay': particle.delay,
            '--duration': particle.duration,
          }}
        />
      ))}

      {codeParticles.map((particle) => (
        <span
          className="code-particle"
          key={particle.text}
          style={{
            '--left': particle.left,
            '--top': particle.top,
            '--delay': particle.delay,
            '--duration': particle.duration,
          }}
        >
          {particle.text}
        </span>
      ))}
    </div>
  );
}
