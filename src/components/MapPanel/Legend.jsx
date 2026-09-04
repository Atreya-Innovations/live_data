import { useMemo } from 'react';
import { IDX, paramByKey } from '../../constants/paramDefs.js';
import { colorForCategory } from '../../utils/colorUtils.js';

export default function Legend({ zoom, filters, data, rows, fieldRange }) {
  const meta = paramByKey(filters.param);
  const isCat = !!(meta && meta.categorical);
  const pool = isCat && data ? (meta.pool === 'DOSHA_LABELS' ? data.doshaLabels : data.issues) : null;
  const noDataCount = useMemo(() => {
    if (!data || !rows) return 0;
    const present = new Set(rows.map(r => r[IDX.state]));
    return data.states.length - present.size;
  }, [data, rows]);

  let lo = '', hi = '';
  if (isCat && fieldRange) {
    lo = 'Low · ' + (fieldRange[0] * 100).toFixed(0) + '% ' + (filters.catValue || '');
    hi = 'High · ' + (fieldRange[1] * 100).toFixed(0) + '% ' + (filters.catValue || '');
  } else if (fieldRange) {
    lo = 'Low · ' + fieldRange[0].toFixed(1);
    hi = 'High · ' + fieldRange[1].toFixed(1);
  } else {
    lo = 'Low score · 20';
    hi = 'High score · 80';
  }

  return (
    <div className="legend-bar">
      <span className="legend-label">Scale</span>
      <div id="legendNumeric" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <span className="lo">{lo}</span>
        <div className="legend-gradient"></div>
        <span className="hi">{hi}</span>
      </div>
      {pool && (
        <div className="legend-cats" style={{ display: 'flex' }}>
          {pool.map((label, i) => (
            <span key={i} className="cat-swatch">
              <span className="cat-dot" style={{ background: colorForCategory(meta, i) }}></span>
              {label}
            </span>
          ))}
        </div>
      )}
      <span className="cat-swatch" style={{ marginLeft: 'auto' }}>
        <span className="cat-dot" style={{ background: '#9E9689', opacity: 0.75 }}></span>
        No readings ({noDataCount} states)
      </span>
      <span className="zoom-hint">
        Zoom level {zoom} &mdash; continuous interpolated field, blending comparable cities where readings are sparse
      </span>
    </div>
  );
}
