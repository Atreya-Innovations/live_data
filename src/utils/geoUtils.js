import { INDIA_STATES_GEO } from '../constants/indiaGeo.js';
import { BAD_GPS_MEDICAL_IDS, CITY_GAZETTEER, MAJOR_CITIES, CITY_TIER_LOOKUP, MAJOR_CITY_GAZETTEER, REGION_OF_STATE } from '../constants/cityData.js';
import { IDX } from '../constants/paramDefs.js';

export function normStateName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function ringContains(ring, lat, lon) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const crosses = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygonContains(rings, lat, lon) {
  let inside = false;
  rings.forEach(ring => { if (ringContains(ring, lat, lon)) inside = !inside; });
  return inside;
}

const INDIA_FEATURE_BOUNDS = INDIA_STATES_GEO.features.map(f => {
  const geom = f.geometry;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  polys.forEach(rings => rings[0].forEach(pt => {
    const lon = pt[0], lat = pt[1];
    if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }));
  return { polys, minLon, maxLon, minLat, maxLat };
});

export function isInsideIndia(lat, lon) {
  for (let i = 0; i < INDIA_FEATURE_BOUNDS.length; i++) {
    const fb = INDIA_FEATURE_BOUNDS[i];
    if (lon < fb.minLon || lon > fb.maxLon || lat < fb.minLat || lat > fb.maxLat) continue;
    for (let p = 0; p < fb.polys.length; p++) {
      if (polygonContains(fb.polys[p], lat, lon)) return true;
    }
  }
  return false;
}

const MIN_LAT = 6, MIN_LON = 67;
const GRID_ROWS = 33, GRID_COLS = 32;
const CITY_GRID = (() => {
  const grid = new Array(GRID_ROWS * GRID_COLS);
  for (let r = 0; r < GRID_ROWS; r++) {
    const cLat = MIN_LAT + r + 0.5;
    for (let c = 0; c < GRID_COLS; c++) {
      const cLon = MIN_LON + c + 0.5;
      let best = null, bestD2 = Infinity;
      for (let i = 0; i < MAJOR_CITIES.length; i++) {
        const mc = MAJOR_CITIES[i];
        const dLat = cLat - mc.lat, dLon = cLon - mc.lon;
        const d2 = dLat * dLat + dLon * dLon;
        if (d2 < bestD2) { bestD2 = d2; best = mc; }
      }
      grid[r * GRID_COLS + c] = best;
    }
  }
  return grid;
})();

export function nearestMajorCity(lat, lon) {
  const r = Math.floor(lat - MIN_LAT);
  const c = Math.floor(lon - MIN_LON);
  if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
    return CITY_GRID[r * GRID_COLS + c];
  }
  let best = null, bestD2 = Infinity;
  for (let i = 0; i < MAJOR_CITIES.length; i++) {
    const mc = MAJOR_CITIES[i];
    const dLat = lat - mc.lat, dLon = lon - mc.lon;
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < bestD2) { bestD2 = d2; best = mc; }
  }
  return best;
}

export function gazetteerLookup(cityName) {
  if (!cityName) return null;
  const key = String(cityName).trim().toLowerCase();
  return CITY_GAZETTEER[key] || MAJOR_CITY_GAZETTEER[key] || null;
}

export const STATE_POLY_CENTROID = (() => {
  const m = {};
  INDIA_STATES_GEO.features.forEach(f => {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let la = 0, lo = 0, n = 0;
    polys.forEach(rings => rings[0].forEach(pt => { lo += pt[0]; la += pt[1]; n++; }));
    if (n) m[normStateName(f.properties.name)] = [la / n, lo / n];
  });
  return m;
})();

function hasRealCoords(r) {
  return r[IDX.lat] != null && r[IDX.lon] != null && !isNaN(r[IDX.lat]) && !isNaN(r[IDX.lon]);
}

export function fillMissingCoords(ROWS, STATES, CITIES) {
  ROWS.forEach(r => {
    if (BAD_GPS_MEDICAL_IDS.has(r[IDX.medical_id])) {
      r[IDX.lat] = null; r[IDX.lon] = null;
    }
  });
  const cityAgg = {}, stateAgg = {};
  ROWS.forEach(r => {
    if (!hasRealCoords(r)) return;
    r[IDX.approx] = 0;
    const cName = CITIES[r[IDX.city]], sName = STATES[r[IDX.state]];
    if (cName && cName !== 'Unknown') {
      const a = cityAgg[cName] || (cityAgg[cName] = { la: 0, lo: 0, n: 0 });
      a.la += r[IDX.lat]; a.lo += r[IDX.lon]; a.n++;
    }
    if (sName && sName !== 'Unknown') {
      const a = stateAgg[sName] || (stateAgg[sName] = { la: 0, lo: 0, n: 0 });
      a.la += r[IDX.lat]; a.lo += r[IDX.lon]; a.n++;
    }
  });
  ROWS.forEach((r, i) => {
    if (hasRealCoords(r)) return;
    const cName = CITIES[r[IDX.city]], sName = STATES[r[IDX.state]];
    const c = (cName && cName !== 'Unknown') ? cityAgg[cName] : null;
    const s = (sName && sName !== 'Unknown') ? stateAgg[sName] : null;
    let pos = null, kind = '';
    if (c && c.n) { pos = [c.la / c.n, c.lo / c.n]; kind = 'city'; }
    else if (gazetteerLookup(cName)) { pos = gazetteerLookup(cName); kind = 'gazetteer'; }
    else if (s && s.n) { pos = [s.la / s.n, s.lo / s.n]; kind = 'state'; }
    else if (sName) {
      const pc = STATE_POLY_CENTROID[normStateName(sName)];
      if (pc) { pos = pc; kind = 'poly'; }
    }
    if (pos) {
      const spread = (kind === 'city' || kind === 'gazetteer') ? 0.055 : 0.38;
      const ang = ((i * 2.399963) % (Math.PI * 2));
      const rad = spread * Math.sqrt(((i * 0.618034) % 1));
      r[IDX.lat] = pos[0] + rad * Math.sin(ang);
      r[IDX.lon] = pos[1] + rad * Math.cos(ang);
      r[IDX.approx] = 1;
    }
  });
}

export function regionForStateName(stateName) {
  return REGION_OF_STATE[normStateName(stateName)] || null;
}
