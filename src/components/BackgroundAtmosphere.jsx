const particleLayers = [
  {
    name: 'far',
    particles: [
      { left: '8%', top: '16%', size: 1, blur: 8, delay: '-6s', duration: '38s', driftX: 10, driftY: -16 },
      { left: '21%', top: '34%', size: 1, blur: 8, delay: '-18s', duration: '44s', driftX: -8, driftY: -14 },
      { left: '39%', top: '13%', size: 1, blur: 9, delay: '-24s', duration: '42s', driftX: 9, driftY: -18 },
      { left: '57%', top: '28%', size: 1, blur: 7, delay: '-12s', duration: '40s', driftX: -6, driftY: -13 },
      { left: '74%', top: '18%', size: 1, blur: 9, delay: '-30s', duration: '46s', driftX: 7, driftY: -16 },
      { left: '88%', top: '39%', size: 1, blur: 8, delay: '-20s', duration: '41s', driftX: -9, driftY: -15 },
      { left: '31%', top: '82%', size: 1, blur: 10, delay: '-33s', duration: '48s', driftX: 8, driftY: -12 },
      { left: '65%', top: '91%', size: 1, blur: 10, delay: '-27s', duration: '45s', driftX: -8, driftY: -12 },
    ],
  },
  {
    name: 'mid',
    particles: [
      { left: '14%', top: '58%', size: 2, blur: 12, delay: '-5s', duration: '31s', driftX: 16, driftY: -26 },
      { left: '35%', top: '48%', size: 2, blur: 13, delay: '-15s', duration: '34s', driftX: -14, driftY: -24 },
      { left: '51%', top: '69%', size: 1.5, blur: 11, delay: '-22s', duration: '32s', driftX: 13, driftY: -22 },
      { left: '72%', top: '57%', size: 2, blur: 14, delay: '-9s', duration: '36s', driftX: -16, driftY: -28 },
      { left: '91%', top: '75%', size: 1.5, blur: 12, delay: '-19s', duration: '33s', driftX: -12, driftY: -24 },
    ],
  },
  {
    name: 'near',
    particles: [
      { left: '19%', top: '76%', size: 3, blur: 18, delay: '-4s', duration: '26s', driftX: 22, driftY: -34 },
      { left: '48%', top: '88%', size: 2.5, blur: 18, delay: '-13s', duration: '29s', driftX: -18, driftY: -32 },
      { left: '82%', top: '64%', size: 3, blur: 20, delay: '-21s', duration: '28s', driftX: -24, driftY: -36 },
    ],
  },
];

const codeParticles = [
  { text: 'const', left: '12%', top: '43%', delay: '-4s', duration: '42s' },
  { text: '{ }', left: '68%', top: '46%', delay: '-16s', duration: '48s' },
  { text: 'while', left: '79%', top: '22%', delay: '-22s', duration: '46s' },
  { text: '< >', left: '28%', top: '72%', delay: '-11s', duration: '44s' },
  { text: 'lake', left: '63%', top: '82%', delay: '-27s', duration: '50s' },
];

export default function BackgroundAtmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="distant-shore" />
      <div className="lake-sheen" />
      <div className="lower-mist" />

      {particleLayers.map((layer) => (
        <div className={`particle-layer particle-layer-${layer.name}`} key={layer.name}>
          {layer.particles.map((particle, index) => (
            <span
              className="particle"
              key={`${layer.name}-${index}`}
              style={{
                '--left': particle.left,
                '--top': particle.top,
                '--size': `${particle.size}px`,
                '--blur': `${particle.blur}px`,
                '--delay': particle.delay,
                '--duration': particle.duration,
                '--drift-x': `${particle.driftX}px`,
                '--drift-y': `${particle.driftY}px`,
              }}
            />
          ))}
        </div>
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
