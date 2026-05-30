/* VFX Hub UI components. Exports to window for app.jsx. */
const { useState, useEffect, useRef, useMemo } = React;

/* ── Icons ────────────────────────────────────────────────── */
const I = {
  search: <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />,
  play: <path d="M5 3.5l14 8.5-14 8.5z" fill="currentColor" stroke="none" />,
  download: <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />,
  spark: <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
  weight: <path d="M7 8h10l2 12H5L7 8zM9 8a3 3 0 116 0" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chev: <path d="M9 6l6 6-6 6" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  flame: <path d="M12 3c2 3 4 4.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C9 9 9 7 12 3z" />,
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  swords: <path d="M3 3l7 7-2 2-7-7zM21 3l-9 9M14 12l7 7M6 18l-3 3" />,
  orbit: <path d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M3 12a9 4 0 0018 0M3 12a9 4 0 0118 0" />,
  smoke: <path d="M6 18a3 3 0 010-6 4 4 0 017.5-1.5A3.5 3.5 0 0118 18z" />,
  coin: <path d="M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 7v10M9.5 9.5h3.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3h3.5" />,
  boom: <path d="M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  portal: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10z" />,
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  copy: <path d="M9 9h10v10H9zM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />,
  check: <path d="M4 12l5 5L20 6" />,
  cube: <path d="M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10" />,
  link: <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5" />,
  caret: <path d="M6 9l6 6 6-6" />,
  google: 'google',
};

function Svg({ d, size, sw, fill, style }) {
  if (d === 'google') {
    return (
      <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" style={style}>
        <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0012 23z" />
        <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 010-4.2V7.1H2.1a11 11 0 000 9.8z" />
        <path fill="#EA4335" d="M12 4.8c1.6 0 3 .6 4.2 1.7l3.1-3.1A11 11 0 002.1 7.1l3.6 2.8C6.6 6.8 9.1 4.8 12 4.8z" />
      </svg>
    );
  }
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth={sw || 1.7} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d}
    </svg>
  );
}

/* Map a category root → icon + hue color (for swatches / sidebar). */
const CAT_META = {
  'RPG':         { icon: I.swords, hue: '#ff7a18' },
  'Explosion':   { icon: I.boom,   hue: '#ff5a2b' },
  'Fire':        { icon: I.flame,  hue: '#ff8a2b' },
  'Magic':       { icon: I.orbit,  hue: '#7c4dff' },
  'Environment': { icon: I.smoke,  hue: '#5eead4' },
  'UI':          { icon: I.coin,   hue: '#ffc830' },
  'Slash':       { icon: I.swords, hue: '#8ad7ff' },
};
function catMeta(path) {
  const root = String(path).split('/')[0];
  return CAT_META[root] || { icon: I.folder, hue: 'var(--accent)' };
}

window.VFXIcons = { I, Svg, catMeta, CAT_META };
