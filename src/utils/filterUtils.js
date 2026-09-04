import { IDX } from '../constants/paramDefs.js';

export const AGE_CATEGORIES = [
  { id: 'child', label: 'Child (0-17)', min: 0, max: 17 },
  { id: 'young', label: 'Young Adult (18-35)', min: 18, max: 35 },
  { id: 'adult', label: 'Adult (36-60)', min: 36, max: 60 },
  { id: 'senior', label: 'Senior (61+)', min: 61, max: 150 },
];
export const PRAHAR_DEFS = [
  { id: 'prahar1', label: 'Pratah (6-9 AM)', start: 360, end: 540 },
  { id: 'prahar2', label: 'Sanghava (9-12 PM)', start: 540, end: 720 },
  { id: 'prahar3', label: 'Madhyahna (12-3 PM)', start: 720, end: 900 },
  { id: 'prahar4', label: 'Aparahna (3-6 PM)', start: 900, end: 1080 },
  { id: 'prahar5', label: 'Sayahna (6-9 PM)', start: 1080, end: 1260 },
  { id: 'prahar6', label: 'Night (9 PM-6 AM)', start: 1260, end: 360 },
];
export const BMI_CATEGORIES = [
  { id: 'underweight', label: 'Underweight (<18.5)', min: 0, max: 18.5 },
  { id: 'normal', label: 'Normal (18.5-24.9)', min: 18.5, max: 25 },
  { id: 'overweight', label: 'Overweight (25-29.9)', min: 25, max: 30 },
  { id: 'obese', label: 'Obese (30+)', min: 30, max: 9999 },
];

export function ageCategoryById(id) { return AGE_CATEGORIES.find(c => c.id === id); }
export function praharById(id) { return PRAHAR_DEFS.find(p => p.id === id); }
export function bmiCategoryById(id) { return BMI_CATEGORIES.find(c => c.id === id); }

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const m = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3] ? m[3].toUpperCase() : null;
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

export function inPraharWindow(mins, start, end) {
  if (mins === null) return false;
  if (start < end) return mins >= start && mins < end;
  return mins >= start || mins < end;
}

export function rowMatchesAge(r, catIds) {
  if (!catIds.length) return true;
  const age = r[IDX.age];
  if (age == null || isNaN(age)) return false;
  return catIds.some(id => { const c = ageCategoryById(id); return c && age >= c.min && age <= c.max; });
}

export function rowMatchesPrahar(r, praharIds) {
  if (!praharIds.length) return true;
  const mins = parseTimeToMinutes(r[IDX.time]);
  return praharIds.some(id => { const p = praharById(id); return p && inPraharWindow(mins, p.start, p.end); });
}

export function rowMatchesBmi(r, bmiIds) {
  if (!bmiIds.length) return true;
  const bmi = r[IDX.bmi];
  if (bmi == null || isNaN(bmi)) return false;
  return bmiIds.some(id => { const c = bmiCategoryById(id); return c && bmi >= c.min && bmi < c.max; });
}

export function getFilteredRows(ROWS, STATES, COUNTRIES, filters) {
  let rows = ROWS;
  if (filters.country !== '__all__') {
    const ci = COUNTRIES.indexOf(filters.country);
    rows = rows.filter(r => r[IDX.country] === ci);
  }
  if (filters.state !== '__all__') {
    const idx = STATES.indexOf(filters.state);
    rows = rows.filter(r => r[IDX.state] === idx);
  }
  if (filters.ageCategories.length) rows = rows.filter(r => rowMatchesAge(r, filters.ageCategories));
  if (filters.praharIds.length) rows = rows.filter(r => rowMatchesPrahar(r, filters.praharIds));
  if (filters.bmiIds.length) rows = rows.filter(r => rowMatchesBmi(r, filters.bmiIds));
  return rows;
}
