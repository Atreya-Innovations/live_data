import { useMemo } from 'react';
import MultiSelect from './MultiSelect.jsx';
import { PARAM_DEFS, GROUP_LABELS, groupsOrder, paramByKey } from '../constants/paramDefs.js';
import { AGE_CATEGORIES, PRAHAR_DEFS, BMI_CATEGORIES } from '../utils/filterUtils.js';

export default function Controls({ data, filters, onFilterChange, onReset, activeFilterCount }) {
  const states = data ? data.states : [];
  const countries = data ? (data.countries || []) : [];

  const meta = paramByKey(filters.param);
  const isCat = !!(meta && meta.categorical);
  const pool = useMemo(() => {
    if (!isCat || !data || !meta) return [];
    if (meta.pool === 'DOSHA_LABELS') return data.doshaLabels || [];
    if (meta.pool === 'ISSUES') return data.issues || [];
    return [];
  }, [isCat, data, meta]);

  const catOptions = useMemo(() => {
    if (!isCat || !pool.length) return [];
    const counts = {};
    (data?.rows || []).forEach(r => { const v = r[meta.idx]; counts[v] = (counts[v] || 0) + 1; });
    return pool.map((label, i) => ({ label, n: counts[i] || 0 }))
      .filter(o => o.n > 0).sort((a,b) => b.n-a.n).map(o => o.label);
  }, [isCat, pool, data, meta]);

  const set = (key, val) => onFilterChange({ ...filters, [key]: val });

  return (
    <div className="controls">
      <div className="field">
        <label htmlFor="paramSelect">Parameter to visualize</label>
        <select id="paramSelect" value={filters.param} onChange={e => set('param', e.target.value)}>
          {groupsOrder.map(g => (
            <optgroup key={g} label={GROUP_LABELS[g]}>
              {PARAM_DEFS.filter(p => p.group === g).map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {isCat && catOptions.length > 0 && (
        <div className="field small" style={{ minWidth: 220 }}>
          <label htmlFor="catValueSelect">Category to map</label>
          <select id="catValueSelect" value={filters.catValue || catOptions[0]} onChange={e => set('catValue', e.target.value)}>
            {catOptions.map(label => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>
      )}
      <div className="field small">
        <label htmlFor="stateSelect">Filter by State</label>
        <select id="stateSelect" value={filters.state} onChange={e => set('state', e.target.value)}>
          <option value="__all__">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="field small">
        <label htmlFor="countrySelect">Data Scope</label>
        <select id="countrySelect" value={filters.country} onChange={e => set('country', e.target.value)}>
          <option value="__all__">All Data</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field small">
        <label>Age Category</label>
        <MultiSelect id="ageCategoryMS" options={AGE_CATEGORIES} selected={filters.ageCategories} onChange={v => set('ageCategories', v)} />
      </div>
      <div className="field small">
        <label>Prahar (Time of Day)</label>
        <MultiSelect id="praharMS" options={PRAHAR_DEFS} selected={filters.praharIds} onChange={v => set('praharIds', v)} />
      </div>
      <div className="field small">
        <label>BMI Category</label>
        <MultiSelect id="bmiCategoryMS" options={BMI_CATEGORIES} selected={filters.bmiIds} onChange={v => set('bmiIds', v)} />
      </div>
      {activeFilterCount > 0 && (
        <div className="filter-actions">
          <span className="filter-badge">{activeFilterCount} active</span>
          <button className="reset-btn" onClick={onReset} type="button">Reset Filters</button>
        </div>
      )}
      <div className="hint-chip">&#128269; Estimates blend in similarly sized cities from the same region of India.</div>
    </div>
  );
}
