import { useState, useEffect, useRef, useCallback } from 'react';

export default function MultiSelect({ id, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setOpen(false); e.preventDefault(); }
  }, []);

  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
    onChange(next);
  };

  const btnLabel = selected.length === 0
    ? 'All'
    : selected.length === 1
      ? options.find(o => o.id === selected[0])?.label || selected[0]
      : `${selected.length} selected`;

  return (
    <div className={`ms${open ? ' open' : ''}`} ref={ref} id={id} onKeyDown={handleKeyDown}>
      <button
        className={`ms-btn${open ? ' active' : ''}`}
        onClick={() => setOpen(p => !p)}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {btnLabel}
      </button>
      <div className="ms-panel" role="listbox">
        <div className="ms-tools">
          <button type="button" onClick={() => onChange([])}>All</button>
          <button type="button" onClick={() => onChange(options.map(o => o.id))}>None</button>
        </div>
        {options.map(o => (
          <label key={o.id} className="ms-opt" role="option" aria-selected={selected.includes(o.id)}>
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)}
              tabIndex={open ? 0 : -1}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
