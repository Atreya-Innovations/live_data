import { MASTER_SYMPTOMS, MASTER_SYMPTOM_MAP } from '../constants/symptoms.js';
import { IDX } from '../constants/paramDefs.js';
import { normGenderJS } from './colorUtils.js';

export function parseExcelSerialDateTime(val) {
  if (val == null || val === '') return { date: null, time: null };
  const num = Number(val);
  if (!isNaN(num) && num > 1000) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const h24 = d.getUTCHours();
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return { date, time: `${h12}:${mins} ${ampm}`, year };
  }
  if (typeof val === 'string') {
    const s = val.trim();
    const parts = s.split(/[T\s]+/);
    const date = parts[0] || null;
    let time = null;
    if (parts[1]) {
      const tm = parts[1].match(/^(\d{1,2}):(\d{2})/);
      if (tm) {
        let h = parseInt(tm[1], 10);
        const mn = tm[2];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        time = `${h12}:${mn} ${ampm}`;
      }
    }
    return { date, time };
  }
  return { date: null, time: null };
}

export function computeAgeFromDob(val, refYear) {
  if (val == null || val === '') return NaN;
  const num = Number(val);
  if (!isNaN(num) && num > 1000) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const birthYear = new Date(ms).getUTCFullYear();
    return (refYear || 2026) - birthYear;
  }
  if (typeof val === 'string') {
    const m = val.match(/^(\d{4})/);
    if (m) return (refYear || 2026) - parseInt(m[1], 10);
  }
  return NaN;
}

const DOSHA_CODE_MAP = {
  p:'Pitta', v:'Vata', k:'Kapha',
  vp:'Vata-Pitta', pv:'Pitta-Vata', kp:'Kapha-Pitta',
  pk:'Pitta-Kapha', vk:'Vata-Kapha', kv:'Kapha-Vata', kpv:'Kapha-Pitta-Vata', vpk:'Vata-Pitta-Kapha'
};

export function normalizeDoshaValue(raw) {
  if (!raw) return 'Not Recorded';
  const s = String(raw).trim();
  if (!s) return 'Not Recorded';
  const vlM = s.match(/^VL_Prakruti(?:_ws)?_(.+)$/i);
  if (vlM) {
    const code = vlM[1].toLowerCase().replace(/^vl_/i, '');
    if (DOSHA_CODE_MAP[code]) return DOSHA_CODE_MAP[code];
  }
  const semM = s.match(/;([A-Za-z ]+(?:-[A-Za-z]+)*)$/);
  if (semM) {
    const label = semM[1].trim();
    const norm = label.replace(/\s+/g, '-');
    for (const v of Object.values(DOSHA_CODE_MAP)) {
      if (v.toLowerCase() === norm.toLowerCase() || v.toLowerCase() === label.toLowerCase()) return v;
    }
    return label;
  }
  const direct = s.replace(/\s+/g, '-');
  for (const v of Object.values(DOSHA_CODE_MAP)) {
    if (v.toLowerCase() === direct.toLowerCase() || v.toLowerCase() === s.toLowerCase()) return v;
  }
  return s.length > 30 ? 'Not Recorded' : s;
}

export function classifySymptoms(text) {
  if (text === null || text === undefined || String(text).trim() === '') return 'Others';
  const parts = String(text).split(',').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return 'Others';
  for (const p of parts) {
    const key = p.replace(/\s+/g, ' ').trim().toLowerCase();
    if (MASTER_SYMPTOM_MAP[key]) return MASTER_SYMPTOM_MAP[key];
  }
  return 'Others';
}

const ci = (arr, ...aliases) => {
  for (const h of arr) {
    const hn = String(h || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    for (const a of aliases) {
      if (hn === a || hn.includes(a)) return arr.indexOf(h);
    }
  }
  return null;
};

export function parseWorkbookRecords(wb) {
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const { utils } = window.XLSX || {};
  if (!utils) throw new Error('XLSX not loaded');
  const aoa = utils.sheet_to_json(sheet, { header: 1, defval: null });
  if (!aoa.length) throw new Error('Empty sheet');

  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    const row = aoa[i];
    if (row && row.some(c => c !== null && c !== '')) { headerRowIdx = i; break; }
  }
  const headers = aoa[headerRowIdx].map(h => String(h || '').toLowerCase().replace(/[^a-z0-9_]/g, ''));

  const colMid = ci(headers, 'medicalid', 'medical_id');
  const colPid = ci(headers, 'patientid', 'patient_id');
  const colDid = ci(headers, 'doctorid', 'doctor_id');
  const colName = ci(headers, 'customername', 'patientname');
  const colLat = ci(headers, 'latitude', 'lat');
  const colLon = ci(headers, 'longitude', 'lon', 'lng');
  const colLatLon = ci(headers, 'latitudelongitude', 'lattitudelongitude', 'latlng', 'latlon');
  const colDate = ci(headers, 'reportdate');
  const colTime = ci(headers, 'reporttime');
  const colModOn = ci(headers, 'lastmodifiedon', 'last_modified_on');
  const colAge = ci(headers, 'age');
  const colDob = ci(headers, 'dateofbirth', 'dob');
  const colGender = ci(headers, 'gender');
  const colHeight = ci(headers, 'height', 'heightcm');
  const colWeight = ci(headers, 'weight', 'weightkg');
  const colBmi = ci(headers, 'bmi');
  const colPulse = ci(headers, 'pulserate', 'nadipulse', 'pulse');
  const colRhythm = ci(headers, 'rhythm', 'nadirhythm');
  const colSama = ci(headers, 'samanirama', 'sama_nirama');
  const colManda = ci(headers, 'mandavegavati', 'manda_vegavati');
  const colBala = ci(headers, 'bala');
  const colAgni = ci(headers, 'agni');
  const colVikruti = ci(headers, 'vikruti', 'virkriti', 'vikriti');
  const colPrakriti = ci(headers, 'patientprakruti', 'prakruti', 'prakriti', 'qbasedprakruti');
  const colIssue = ci(headers, 'majorsymptomsclassified', 'majorsymptoms', 'majorissue');
  const colState = ci(headers, 'state');
  const colCity = ci(headers, 'city');
  const colCountry = ci(headers, 'country');

  const records = [];
  for (let r = headerRowIdx + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row || !row.length) continue;
    const mid = colMid != null ? row[colMid] : (r - headerRowIdx);
    if (mid === null || mid === undefined || mid === '') continue;

    const pid = colPid != null ? row[colPid] : mid;
    const nameRaw = colName != null ? row[colName] : null;
    const patientName = (nameRaw != null && String(nameRaw).trim() !== '') ? String(nameRaw).trim() : ('Patient ' + pid);

    let lat = colLat != null ? parseFloat(row[colLat]) : NaN;
    let lon = colLon != null ? parseFloat(row[colLon]) : NaN;
    if ((isNaN(lat) || isNaN(lon)) && colLatLon != null && row[colLatLon]) {
      const parts = String(row[colLatLon]).replace(/["]/g,'').split(/[\s,;]+/).filter(Boolean);
      if (parts.length >= 2) { lat = parseFloat(parts[0]); lon = parseFloat(parts[1]); }
    }

    let repDate = colDate != null ? row[colDate] : null;
    let repTime = colTime != null ? row[colTime] : null;
    if ((!repDate || !repTime) && colModOn != null && row[colModOn] != null) {
      const dtParsed = parseExcelSerialDateTime(row[colModOn]);
      if (!repDate) repDate = dtParsed.date;
      if (!repTime) repTime = dtParsed.time;
    }

    let age = colAge != null ? parseInt(row[colAge], 10) : NaN;
    if (isNaN(age) && colDob != null && row[colDob] != null) {
      const refY = (repDate && String(repDate).match(/^(\d{4})/)) ? parseInt(String(repDate).slice(0,4), 10) : 2026;
      age = computeAgeFromDob(row[colDob], refY);
    }
    if (isNaN(age) || age == null) age = 45;

    const height = colHeight != null ? parseFloat(row[colHeight]) : null;
    const weight = colWeight != null ? parseFloat(row[colWeight]) : null;
    let bmi = colBmi != null ? parseFloat(row[colBmi]) : NaN;
    if (isNaN(bmi) && height && weight && height > 0 && weight > 0) {
      const hM = height / 100;
      bmi = Math.round((weight / (hM * hM)) * 10) / 10;
    }

    const rawGender = colGender != null ? String(row[colGender] || '').trim() : '';
    const normGen = normGenderJS(rawGender);

    const rawRhythm = colRhythm != null ? String(row[colRhythm] || '') : '';
    const normRhythm = rawRhythm.toLowerCase().includes('irregular') ? 'Irregular' : 'Regular';
    const rawSama = colSama != null ? String(row[colSama] || '') : '';
    const normSama = rawSama.toLowerCase().includes('nirama') ? 'Nirama' : 'Sama';
    const rawManda = colManda != null ? String(row[colManda] || '') : '';
    const normManda = (rawManda.toLowerCase().includes('vegawati') || rawManda.toLowerCase().includes('vegavati')) ? 'Vegawati' : 'Manda';

    const bala = colBala != null ? parseFloat(row[colBala]) : 50;
    const agni = colAgni != null ? parseFloat(row[colAgni]) : 50;
    const virkriti = normalizeDoshaValue(colVikruti != null ? row[colVikruti] : null);
    const prakriti = normalizeDoshaValue(colPrakriti != null ? row[colPrakriti] : null);
    const issue = classifySymptoms(colIssue != null ? row[colIssue] : null);

    records.push({
      medical_id: mid,
      patient_id: pid,
      name: patientName,
      doctor_id: colDid != null ? row[colDid] : 'Doctor',
      state: (colState != null && row[colState]) ? String(row[colState]).trim() : 'Unknown',
      city: (colCity != null && row[colCity]) ? String(row[colCity]).trim() : 'Unknown',
      lat: isNaN(lat) ? null : lat,
      lon: isNaN(lon) ? null : lon,
      date: repDate || '2026-08-01',
      time: repTime || '12:00 PM',
      age: isNaN(age) ? 45 : age,
      gender: normGen,
      height: isNaN(height) ? 165 : height,
      weight: isNaN(weight) ? 65 : weight,
      bmi: isNaN(bmi) ? 23.5 : bmi,
      pulse: colPulse != null ? parseFloat(row[colPulse]) : 72,
      rhythm: normRhythm,
      sama_nirama: normSama,
      manda_vegawati: normManda,
      bala: isNaN(bala) ? 50 : bala,
      agni: isNaN(agni) ? 50 : agni,
      virkriti,
      prakriti,
      issue,
      country: colCountry != null ? row[colCountry] : null,
    });
  }
  if (!records.length) throw new Error('No data rows found under the header row.');
  return records;
}
