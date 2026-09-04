export function logScaleT(tLinear) {
  const t = Math.max(0, Math.min(1, tLinear));
  return Math.log1p(t * (Math.E - 1));
}
export function logScaledScore(tLinear) { return 20 + logScaleT(tLinear) * 60; }

const COLOR_STOPS = [
  [0.00, [42, 111, 219]],
  [0.25, [52, 198, 198]],
  [0.45, [63, 191, 107]],
  [0.65, [232, 211, 74]],
  [0.82, [240, 139, 46]],
  [1.00, [222, 59, 59]]
];

// Precomputed 256-entry 32-bit pixel LUT (RGBA in little-endian uint32: 0xAABBGGRR)
export const COLOR_LUT_32 = (() => {
  const lut = new Uint32Array(256);
  for (let step = 0; step < 256; step++) {
    const t = step / 255;
    let r = 222, g = 59, b = 59;
    for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
      const [t0, c0] = COLOR_STOPS[i], [t1, c1] = COLOR_STOPS[i + 1];
      if (t >= t0 && t <= t1) {
        const f = (t - t0) / (t1 - t0 || 1);
        r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
        g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
        b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
        break;
      }
    }
    lut[step] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return lut;
})();

export function colorForT(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [t0, c0] = COLOR_STOPS[i], [t1, c1] = COLOR_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0 || 1);
      return `rgb(${Math.round(c0[0]+(c1[0]-c0[0])*f)},${Math.round(c0[1]+(c1[1]-c0[1])*f)},${Math.round(c0[2]+(c1[2]-c0[2])*f)})`;
    }
  }
  return 'rgb(222,59,59)';
}

export function colorForCategory(meta, catIdx) {
  return (meta.colors && meta.colors[catIdx]) || '#9AA0A6';
}

export function genColorsJS(n) {
  const palette = [
    '#3186CC','#D9463C','#4CA35B','#E89B2F','#9B59B6','#1ABC9C',
    '#E74C3C','#2ECC71','#F39C12','#8E44AD','#16A085','#C0392B',
    '#27AE60','#D35400','#7D3C98','#148F77','#922B21','#1F618D',
    '#196F3D','#7E5109','#6C3483'
  ];
  const out = [];
  for (let i = 0; i < n; i++) out.push(palette[i % palette.length]);
  return out;
}

export function normGenderJS(g) {
  if (!g) return 'Other';
  const s = String(g).toLowerCase();
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('m')) return 'Male';
  return 'Other';
}
