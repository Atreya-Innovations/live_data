import { useMemo } from 'react';
import { IDX, paramByKey } from '../constants/paramDefs.js';

const STAT_ICONS = ['📊', '🗺️', '🎯', '📈', '📐'];

function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-skeleton">
        <div className="skel-line" style={{ width: '50%' }}></div>
        <div className="skel-line lg"></div>
      </div>
    </div>
  );
}

export default function StatsRow({ rows, filters, data }) {
  const stats = useMemo(() => {
    if (!rows || !data) return null;
    const meta = paramByKey(filters.param);
    const isCat = !!(meta && meta.categorical);
    const statesCovered = new Set(rows.map(r => r[IDX.state])).size;

    if (isCat) {
      const pool = meta.pool === 'DOSHA_LABELS' ? data.doshaLabels : data.issues;
      const targetIdx = pool ? pool.indexOf(filters.catValue) : 0;
      const nHit = rows.reduce((a, r) => a + (r[meta.idx] === targetIdx ? 1 : 0), 0);
      const overall = rows.length ? (nHit / rows.length * 100) : 0;
      const distinct = new Set(rows.map(r => r[meta.idx])).size;
      return [
        { label: 'Total Readings', value: rows.length.toLocaleString() },
        { label: 'States Covered', value: statesCovered },
        { label: 'Mapped Category', value: filters.catValue || '—' },
        { label: 'Overall Share', value: overall.toFixed(1) + '%', sub: 'of readings' },
        { label: 'Categories Present', value: distinct },
      ];
    } else {
      let min = Infinity, max = -Infinity, sum = 0;
      rows.forEach(r => { const v = r[meta.idx]; if (v < min) min = v; if (v > max) max = v; sum += v; });
      const avg = rows.length ? (sum / rows.length) : 0;
      return [
        { label: 'Total Readings', value: rows.length.toLocaleString() },
        { label: 'States Covered', value: statesCovered },
        { label: 'Selected Parameter', value: meta.label },
        { label: 'Average Value', value: avg.toFixed(1), sub: meta.unit },
        { label: 'Score Range', value: '20 – 80', sub: 'log-scaled' },
      ];
    }
  }, [rows, filters, data]);

  if (!stats) {
    return (
      <div className="stats">
        {Array.from({ length: 5 }, (_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="stats">
      {stats.map((s, i) => (
        <div className="stat-card" key={i}>
          <span className="stat-icon">{STAT_ICONS[i]}</span>
          <div className="label">{s.label}</div>
          <div className="value">{s.value}{s.sub ? <small> {s.sub}</small> : null}</div>
        </div>
      ))}
    </div>
  );
}
