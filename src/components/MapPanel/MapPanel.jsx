import { useState, useCallback } from 'react';
import HeatMap from './HeatMap.jsx';
import Legend from './Legend.jsx';
import { paramByKey, GROUP_LABELS } from '../../constants/paramDefs.js';

export default function MapPanel({ rows, filters, data }) {
  const [zoom, setZoom] = useState(5);
  const [fieldRange, setFieldRange] = useState(null);
  const meta = paramByKey(filters.param);

  const handleZoom = useCallback((newZoom) => {
    setZoom(prev => (prev === newZoom ? prev : newZoom));
  }, []);

  const handleFieldRange = useCallback((newRange) => {
    setFieldRange(prev => {
      if (!prev && !newRange) return prev;
      if (prev && newRange && Math.abs(prev[0] - newRange[0]) < 0.05 && Math.abs(prev[1] - newRange[1]) < 0.05) {
        return prev;
      }
      return newRange;
    });
  }, []);

  const readingCount = rows ? rows.length : 0;

  return (
    <div className="map-panel">
      <div className="map-head">
        <h3>{meta ? meta.label : 'Parameter'} — India Heatmap</h3>
        <div className="tags">
          <div className="param-tag">{meta ? GROUP_LABELS[meta.group] : '—'}</div>
          <div className="mode-tag">Weather Field</div>
          {readingCount > 0 && (
            <div className="readings-tag">{readingCount.toLocaleString()} readings</div>
          )}
        </div>
      </div>
      <HeatMap rows={rows} filters={filters} data={data} onZoom={handleZoom} onFieldRange={handleFieldRange} />
      <Legend zoom={zoom} filters={filters} data={data} rows={rows} fieldRange={fieldRange} />
    </div>
  );
}
