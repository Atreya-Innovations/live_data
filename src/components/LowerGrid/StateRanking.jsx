import { useMemo } from 'react';
import { IDX, paramByKey } from '../../constants/paramDefs.js';

const MEDAL = ['gold', 'silver', 'bronze'];

export default function StateRanking({ rows, filters, data }) {
  const meta = paramByKey(filters.param);
  const isCat = !!(meta && meta.categorical);

  const list = useMemo(() => {
    if (!rows || !rows.length || !data) return [];
    if (isCat) {
      const pool = meta.pool === 'DOSHA_LABELS' ? data.doshaLabels : data.issues;
      const targetIdx = pool ? pool.indexOf(filters.catValue) : 0;
      const perState = {};
      rows.forEach(r => {
        const s = data.states[r[IDX.state]];
        if (!perState[s]) perState[s] = { hit: 0, n: 0 };
        if (r[meta.idx] === targetIdx) perState[s].hit++;
        perState[s].n++;
      });
      return Object.keys(perState)
        .filter(s => perState[s].n >= 20)
        .map(s => ({ state: s, share: (perState[s].hit / perState[s].n) * 100, n: perState[s].n, catName: pool?.[targetIdx] || '' }))
        .sort((a, b) => b.share - a.share)
        .slice(0, 10);
    } else {
      const perState = {};
      rows.forEach(r => {
        const s = data.states[r[IDX.state]];
        if (!perState[s]) perState[s] = { sum: 0, n: 0 };
        perState[s].sum += r[meta.idx]; perState[s].n++;
      });
      const items = Object.keys(perState).map(s => ({ state: s, avg: perState[s].sum / perState[s].n, n: perState[s].n }))
        .sort((a, b) => b.avg - a.avg).slice(0, 10);
      const maxAvg = Math.max(...items.map(x => x.avg), 1);
      const minAvg = Math.min(...items.map(x => x.avg), 0);
      return items.map(x => ({ ...x, maxAvg, minAvg }));
    }
  }, [rows, filters, data, isCat, meta]);

  const header = isCat ? 'Share of category' : 'Average';

  if (!list.length) {
    return (
      <div className="panel">
        <h3>Top States by Selected Parameter</h3>
        <p className="sub">Average value per state, ranked highest to lowest</p>
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Not enough data to rank states. Try adjusting your filters or selecting a different parameter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Top States by Selected Parameter</h3>
      <p className="sub">Average value per state, ranked highest to lowest</p>
      <table className="rank">
        <thead><tr><th>#</th><th>State</th><th>Readings</th><th style={{ width: '38%' }}>{header}</th></tr></thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={x.state}>
              <td><span className={`rank-num${i < 3 ? ' ' + MEDAL[i] : ''}`}>{i + 1}</span></td>
              <td title={x.state}>{x.state}</td>
              <td>{x.n.toLocaleString()}</td>
              <td>
                <div className="bar-cell">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: isCat
                          ? x.share.toFixed(0) + '%'
                          : ((x.avg - x.minAvg) / ((x.maxAvg - x.minAvg) || 1) * 100).toFixed(0) + '%',
                        animationDelay: (i * 60) + 'ms',
                      }}
                    ></div>
                  </div>
                  <span className="bar-value">
                    {isCat ? x.share.toFixed(0) + '%' : x.avg.toFixed(1)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
