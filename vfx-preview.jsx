/* VFXPreview — renders a procedural animated tile for a given previewType.
   Plays on hover (controlled by parent passing `playing`), idle shows a
   frozen representative frame via negative animation-delays. */

const { useMemo: _vfxUseMemo } = React;

function _rand(seed) {
  // deterministic pseudo-random from a seed so a card looks stable across renders
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function VFXPreview({ type, playing, seedKey }) {
  const baseSeed = useMemo(() => {
    let h = 0;
    const s = String(seedKey || type || 'x');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return h + 1;
  }, [seedKey, type]);

  const parts = useMemo(() => buildParticles(type, baseSeed), [type, baseSeed]);

  return (
    <div className={'vfxp vfxp-' + type + (playing ? ' is-playing' : '')}>
      {parts}
    </div>
  );
}

function buildParticles(type, seed) {
  const els = [];
  const R = (i) => _rand(seed + i * 1.37);
  const dur = 1.5;

  const glow = (extra) => <div key="glow" className="glow" style={extra || null}></div>;

  switch (type) {
    case 'fire': {
      els.push(glow({ animationDelay: '-0.2s' }));
      for (let i = 0; i < 14; i++) {
        const sz = 8 + R(i) * 14;
        els.push(<div key={i} className="p" style={{
          left: (35 + R(i + 1) * 30) + '%',
          width: sz, height: sz,
          '--dx': (R(i + 2) * 24 - 12) + 'px',
          animationDuration: (1.1 + R(i + 3) * 0.9) + 's',
          animationDelay: '-' + (R(i + 4) * 1.6).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'explosion': {
      els.push(glow({ animationDelay: '-0.3s' }));
      els.push(<div key="ring" className="ring" style={{ animationDelay: '-0.25s' }} />);
      for (let i = 0; i < 18; i++) {
        const sz = 5 + R(i) * 9;
        els.push(<div key={i} className="p" style={{
          width: sz, height: sz,
          '--ang': (R(i + 1) * 360) + 'deg',
          '--dist': (40 + R(i + 2) * 55) + 'px',
          animationDuration: (1.3 + R(i + 3) * 0.6) + 's',
          animationDelay: '-' + (R(i + 4) * 0.9).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'magic': {
      els.push(glow({ animationDelay: '-0.5s' }));
      for (let i = 0; i < 12; i++) {
        const sz = 6 + R(i) * 10;
        els.push(<div key={i} className="p" style={{
          width: sz, height: sz,
          '--ang': (R(i + 1) * 360) + 'deg',
          '--rad': (24 + R(i + 2) * 34) + 'px',
          animationDuration: (2.4 + R(i + 3) * 1.6) + 's',
          animationDelay: '-' + (R(i + 4) * 3).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'heal': {
      els.push(glow({ animationDelay: '-0.4s' }));
      els.push(<div key="ring" className="ring" style={{ animationDelay: '-0.6s' }} />);
      for (let i = 0; i < 12; i++) {
        const sz = 5 + R(i) * 9;
        els.push(<div key={i} className="p" style={{
          left: (35 + R(i + 1) * 30) + '%',
          width: sz, height: sz,
          '--dx': (R(i + 2) * 20 - 10) + 'px',
          animationDuration: (1.8 + R(i + 3) * 1) + 's',
          animationDelay: '-' + (R(i + 4) * 2.2).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'lightning': {
      els.push(glow({ animationDelay: '-0.1s' }));
      for (let i = 0; i < 5; i++) {
        const segs = 3 + Math.floor(R(i) * 2);
        let top = 8;
        for (let s = 0; s < segs; s++) {
          const h = 14 + R(i + s) * 18;
          const rot = (R(i + s + 1) * 40 - 20);
          els.push(<div key={i + '-' + s} className="bolt" style={{
            left: (30 + R(i + 1) * 40) + '%',
            top: top + '%',
            height: h + '%',
            transform: 'rotate(' + rot + 'deg)',
            animationDelay: '-' + (R(i + 2) * 0.42).toFixed(2) + 's',
          }} />);
          top += h * 0.7;
        }
      }
      break;
    }
    case 'smoke': {
      for (let i = 0; i < 9; i++) {
        const sz = 18 + R(i) * 22;
        els.push(<div key={i} className="p" style={{
          left: (32 + R(i + 1) * 36) + '%',
          width: sz, height: sz,
          '--dx': (R(i + 2) * 30 - 15) + 'px',
          animationDuration: (2.8 + R(i + 3) * 1.4) + 's',
          animationDelay: '-' + (R(i + 4) * 3.4).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'coin': {
      els.push(glow({ animationDelay: '-0.3s' }));
      for (let i = 0; i < 14; i++) {
        const sz = 7 + R(i) * 7;
        els.push(<div key={i} className="p" style={{
          left: (40 + R(i + 1) * 20) + '%',
          width: sz, height: sz,
          '--dx': (R(i + 2) * 80 - 40) + 'px',
          '--rise': '-' + (40 + R(i + 3) * 50) + 'px',
          animationDuration: (1.5 + R(i + 4) * 0.8) + 's',
          animationDelay: '-' + (R(i + 5) * 1.8).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    case 'slash': {
      els.push(<div key="arc" className="arc" style={{ animationDelay: '-0.5s' }} />);
      els.push(<div key="arc2" className="arc" style={{ animationDelay: '-0.85s', opacity: 0.5 }} />);
      break;
    }
    case 'buff': {
      els.push(glow({ animationDelay: '-0.4s' }));
      els.push(<div key="r1" className="ring" style={{ animationDelay: '-0.5s' }} />);
      els.push(<div key="r2" className="ring" style={{ animationDelay: '-1.2s' }} />);
      for (let i = 0; i < 8; i++) {
        const sz = 5 + R(i) * 8;
        els.push(<div key={i} className="p" style={{
          left: (38 + R(i + 1) * 24) + '%',
          width: sz, height: sz,
          '--dx': (R(i + 2) * 16 - 8) + 'px',
          animationDuration: (1.8 + R(i + 3) * 1) + 's',
          animationDelay: '-' + (R(i + 4) * 2.2).toFixed(2) + 's',
        }} />);
      }
      break;
    }
    default:
      els.push(glow());
  }
  return els;
}

window.VFXPreview = VFXPreview;
