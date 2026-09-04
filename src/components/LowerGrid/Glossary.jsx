import { useState } from 'react';
import { PARAM_DEFS, GROUP_LABELS, groupsOrder } from '../../constants/paramDefs.js';

const PARAM_DESCRIPTIONS = {
  age: 'Patient age in years at time of reading',
  height_cm: 'Patient height measured in centimeters',
  weight_kg: 'Patient weight measured in kilograms',
  bmi: 'Body Mass Index calculated from height and weight',
  pulse: 'Nadi pulse rate measured by the device in beats per minute',
  bala_pct: 'Pulse strength (Bala) as a percentage — reflects vitality and immune strength',
  agni_pct: 'Digestive fire (Agni) as a percentage — indicates metabolic and digestive capacity',
  virkriti: 'Current dosha imbalance detected by the device — deviations from natural constitution',
  prakriti: 'Inherent Ayurvedic constitution type of the patient — Vata, Pitta, or Kapha dominant',
  issue: 'Primary clinical symptom or health concern classified by the attending doctor',
};

const GROUP_ICONS = {
  vitals: '💓',
  diagnostics: '⚡',
  diagnosis: '🔬',
};

export default function Glossary() {
  const [activeGroup, setActiveGroup] = useState('vitals');
  const params = PARAM_DEFS.filter(p => p.group === activeGroup);

  return (
    <div className="panel">
      <h3>Parameter Glossary</h3>
      <p className="sub">All tracked device inputs &amp; diagnostic outputs</p>
      <div className="tabs">
        {groupsOrder.map(g => (
          <button
            key={g}
            className={`tab-btn${activeGroup === g ? ' active' : ''}`}
            onClick={() => setActiveGroup(g)}
          >
            {GROUP_ICONS[g] || ''} {GROUP_LABELS[g]}
          </button>
        ))}
      </div>
      <div className="glossary">
        {params.map(p => (
          <div key={p.key} className="item">
            <div className="dot" style={p.categorical ? { background: 'var(--maroon)' } : {}}></div>
            <div className="txt">
              <b>{p.label}{p.unit ? ` (${p.unit})` : ''}</b>
              <span>{PARAM_DESCRIPTIONS[p.key] || 'Tracked per device reading across the network'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
