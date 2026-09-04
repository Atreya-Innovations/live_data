import { IDX } from '../constants/paramDefs.js';

function bar(label, value, max, color) {
  const pct = Math.max(0, Math.min(100, (value / (max || 100)) * 100));
  return `<div class="rcard-row"><span class="rlabel">${label}</span><div class="rcard-track"><div class="rcard-fill" style="width:${pct}%;background:${color};"></div></div><span class="rcard-val">${value}%</span></div>`;
}

export function buildReportCard(row, rowIndex, { NAMES, CITIES, STATES, GENDER, RHYTHM, SAMA_NIRAMA, MANDA_VEGAWATI, DOSHA_LABELS, ISSUES }) {
  const v = k => row[IDX[k]];
  const name = NAMES[rowIndex];
  const city = CITIES[v('city')], state = STATES[v('state')];
  const gender = GENDER[v('gender')];
  const rhythm = RHYTHM[v('rhythm')], sn = SAMA_NIRAMA[v('sama_nirama')], mv = MANDA_VEGAWATI[v('manda_vegawati')];
  const virkriti = DOSHA_LABELS[v('virkriti')], prakriti = DOSHA_LABELS[v('prakriti')];
  const issue = ISSUES[v('issue')];
  return `
  <div class="rcard">
    <div class="rcard-head">
      <div class="name">${name} <span style="opacity:.7;font-weight:400;">(Medical ID ${v('medical_id')})</span></div>
      <div class="meta">${city}, ${state} &middot; ${v('date')}, ${v('time')}</div>
      <div class="meta">${gender}, ${v('age')} yrs &middot; ${v('height_cm')} cm &middot; ${v('weight_kg')} kg &middot; BMI ${v('bmi')}</div>
      <div class="meta">Patient ID: ${v('patient_id')} &middot; Doctor ID: ${v('doctor_id')}</div>
    </div>
    <div class="rcard-body">
      <div class="rcard-section">
        <h4>Nadi Parameters</h4>
        <div class="rcard-grid">
          <div>Pulse: <b>${v('pulse')} bpm</b></div>
          <div>Rhythm: <b>${rhythm}</b></div>
          <div>Sama/Nirama: <b>${sn}</b></div>
          <div>Manda/Vegawati: <b>${mv}</b></div>
        </div>
      </div>
      <div class="rcard-section">
        <h4>Bala &amp; Agni</h4>
        ${bar('Bala', v('bala_pct'), 100, 'var(--maroon)')}
        ${bar('Agni', v('agni_pct'), 100, 'var(--gold)')}
      </div>
      <div class="rcard-section">
        <h4>Constitution &amp; Diagnosis</h4>
        <span class="rcard-tag">Prakriti: ${prakriti}</span>
        <span class="rcard-tag" style="margin-left:6px;">Virkriti: ${virkriti}</span>
        <div style="margin-top:8px;font-size:11.5px;color:var(--muted);">Major issue (doctor): <b style="color:var(--ink);">${issue}</b></div>
      </div>
    </div>
  </div>`;
}
