import { IDX } from '../constants/paramDefs.js';
import { nearestMajorCity, regionForStateName } from './geoUtils.js';
import { INDIA_STATES_GEO } from '../constants/indiaGeo.js';
import { logScaleT, COLOR_LUT_32 } from './colorUtils.js';
export function kernelSigmaDeg(zoom) { return Math.max(0.5, 4.2 - zoom * 0.55); }
export function heatRadiusPx(zoom) { return Math.max(16, 46 - zoom * 4); }
export function heatBlurPx(zoom) { return Math.max(14, 34 - zoom * 3); }

export function bucketRows(rows, bw) {
  const buckets = new Map();
  rows.forEach(r => {
    const lat = r[IDX.lat], lon = r[IDX.lon];
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;
    const key = Math.round(lat / bw) + ',' + Math.round(lon / bw);
    let b = buckets.get(key);
    if (!b) { b = []; buckets.set(key, b); }
    b.push(r);
  });
  return buckets;
}

export function nearbyRows(buckets, bw, lat, lon) {
  const bx = Math.round(lat / bw), by = Math.round(lon / bw);
  const out = [];
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const b = buckets.get((bx + dx) + ',' + (by + dy));
      if (b) out.push(...b);
    }
  }
  return out;
}

export function fieldSamples(rows, valIdx, isCategorical, targetIdx, cellDeg, STATES, CITIES) {
  const m = new Map();
  rows.forEach(r => {
    const lat = r[IDX.lat], lon = r[IDX.lon];
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;
    const k = Math.round(lat / cellDeg) + ',' + Math.round(lon / cellDeg);
    let c = m.get(k);
    if (!c) { c = { la: 0, lo: 0, v: 0, n: 0, regionCounts: {}, tierCounts: {} }; m.set(k, c); }
    c.la += lat; c.lo += lon; c.n += 1;
    c.v += isCategorical ? (r[valIdx] === targetIdx ? 1 : 0) : r[valIdx];
    const region = regionForStateName(STATES[r[IDX.state]]);
    if (region) c.regionCounts[region] = (c.regionCounts[region] || 0) + 1;
  });
  const out = [];
  m.forEach(c => {
    const regionKeys = Object.keys(c.regionCounts);
    const region = regionKeys.length ? regionKeys.sort((a, b) => c.regionCounts[b] - c.regionCounts[a])[0] : null;
    out.push({ lat: c.la / c.n, lon: c.lo / c.n, val: c.v / c.n, n: c.n, region, tier: null });
  });
  return out;
}

export function idwAt(samples, lat, lon) {
  const q = nearestMajorCity(lat, lon);
  let sw = 0, swv = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const dLat = lat - s.lat, dLon = lon - s.lon;
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < 1e-7) return s.val;
    let w = s.n / (d2 + 0.09);
    if (q && s.region && s.region === q.region) w *= 2.0;
    if (q && s.tier != null) {
      const tierDiff = Math.abs(q.tier - s.tier);
      w *= tierDiff === 0 ? 1.8 : (tierDiff === 1 ? 1.25 : 1);
    }
    sw += w; swv += w * s.val;
  }
  return sw > 0 ? swv / sw : null;
}
// Pre-compute polygon rings and their geographical bounds once at startup
const PRECOMPUTED_RINGS = [];
INDIA_STATES_GEO.features.forEach(f => {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  polys.forEach(rings => rings.forEach(ring => {
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    const coords = [];
    for (let i = 0; i < ring.length; i++) {
      const lon = ring[i][0], lat = ring[i][1];
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
      coords.push([lat, lon]);
    }
    PRECOMPUTED_RINGS.push({ coords, minLat, maxLat, minLon, maxLon });
  }));
});

function indiaPath2D(map, vSouth, vNorth, vWest, vEast) {
  const p = new Path2D();
  for (let r = 0; r < PRECOMPUTED_RINGS.length; r++) {
    const ring = PRECOMPUTED_RINGS[r];
    // Cull rings completely outside visible map bounds with small margin
    if (ring.maxLat < vSouth || ring.minLat > vNorth || ring.maxLon < vWest || ring.minLon > vEast) {
      continue;
    }
    const coords = ring.coords;
    for (let i = 0; i < coords.length; i++) {
      const q = map.latLngToContainerPoint(coords[i]);
      if (i === 0) p.moveTo(q.x, q.y); else p.lineTo(q.x, q.y);
    }
    p.closePath();
  }
  return p;
}

export function drawWeatherField(canvas, map, rows, valIdx, isCategorical, targetIdx, STATES, CITIES) {
  const size = map.getSize();
  if (canvas.width !== size.x || canvas.height !== size.y) { canvas.width = size.x; canvas.height = size.y; }
  const L = window.L;
  if (L) {
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const zoom = map.getZoom();
  const samples = fieldSamples(rows, valIdx, isCategorical, targetIdx,
    Math.max(0.18, 1.4 - zoom * 0.10), STATES, CITIES);
  if (!samples.length) return null;

  const b = map.getBounds();
  const south = b.getSouth(), north = b.getNorth();
  const west = b.getWest(), east = b.getEast();

  // Spatially prune samples: IDW weight drops to negligible (<0.02) beyond 3 degrees
  const pad = Math.max(1.8, 4.2 - zoom * 0.35);
  const sMin = south - pad, sMax = north + pad, wMin = west - pad, wMax = east + pad;
  const visibleSamples = samples.filter(s =>
    s.lat >= sMin && s.lat <= sMax && s.lon >= wMin && s.lon <= wMax
  );
  const activeSamples = visibleSamples.length >= 3 ? visibleSamples : samples;

  // High-performance grid resolution with hardware-accelerated bilinear upsampling
  const GW = Math.max(38, Math.min(105, Math.round(size.x / 11)));
  const GH = Math.max(38, Math.min(80, Math.round(size.y / 11)));

  const vals = new Float64Array(GW * GH);
  let vMin = Infinity, vMax = -Infinity;
  for (let j = 0; j < GH; j++) {
    const lat = north - (j + 0.5) / GH * (north - south);
    const rowOffset = j * GW;
    for (let i = 0; i < GW; i++) {
      const lon = west + (i + 0.5) / GW * (east - west);
      const v = idwAt(activeSamples, lat, lon);
      vals[rowOffset + i] = v;
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
    }
  }
  if (!isFinite(vMin)) return null;
  if (vMax - vMin < 1e-9) vMax = vMin + 1e-9;
  const span = vMax - vMin;

  const small = document.createElement('canvas');
  small.width = GW; small.height = GH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(GW, GH);
  const img32 = new Uint32Array(img.data.buffer);

  // Blazing fast direct 32-bit pixel writing via precomputed LUT (zero regex/string allocations)
  for (let k = 0; k < GW * GH; k++) {
    const t = logScaleT((vals[k] - vMin) / span);
    const idx = (t * 255) | 0;
    img32[k] = COLOR_LUT_32[idx < 0 ? 0 : (idx > 255 ? 255 : idx)];
  }
  sctx.putImageData(img, 0, 0);

  // Direct canvas clipping to India states boundaries (avoids multi-MB mask canvas allocation)
  ctx.save();
  const path = indiaPath2D(map, south - 0.2, north + 0.2, west - 0.2, east + 0.2);
  ctx.clip(path);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = 0.82;
  ctx.drawImage(small, 0, 0, GW, GH, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  return [vMin, vMax];
}

export function spiderfyOverlaps(rows) {
  const groups = new Map();
  rows.forEach(r => {
    const lat = r[IDX.lat], lon = r[IDX.lon];
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;
    const key = lat.toFixed(3) + ',' + lon.toFixed(3);
    let g = groups.get(key);
    if (!g) { g = []; groups.set(key, g); }
    g.push(r);
  });
  const out = new Map();
  groups.forEach(group => {
    const n = group.length;
    if (n <= 1) return;
    const radiusDeg = Math.min(0.05, 0.006 * Math.sqrt(n));
    group.forEach((r, idx) => {
      const ang = (idx * 2.399963) % (Math.PI * 2);
      const rad = radiusDeg * Math.sqrt((idx + 0.5) / n);
      out.set(r, [r[IDX.lat] + rad * Math.sin(ang), r[IDX.lon] + rad * Math.cos(ang)]);
    });
  });
  return out;
}
