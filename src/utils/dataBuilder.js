import { IDX } from '../constants/paramDefs.js';
import { normGenderJS, genColorsJS } from './colorUtils.js';
import { normStateName } from './geoUtils.js';
import { INDIA_STATES_GEO } from '../constants/indiaGeo.js';

const INDIA_STATE_NAMES_FOR_COUNTRY = new Set(INDIA_STATES_GEO.features.map(f => normStateName(f.properties.name)));

function uniqSortedJS(arr) {
  return [...new Set(arr.filter(x => x != null && x !== ''))].sort((a, b) => String(a).localeCompare(String(b)));
}

function normCountryJS(country, state) {
  const raw = (country == null ? '' : String(country)).trim();
  if (raw) {
    const low = raw.toLowerCase().replace(/\s+/g, ' ');
    if (low === 'iindia' || low === 'india') return 'India';
    if (low === 'uae') return 'United Arab Emirates';
    if (low === 'usa') return 'United States';
    if (INDIA_STATE_NAMES_FOR_COUNTRY.has(normStateName(raw))) return 'India';
    return raw;
  }
  if (state && INDIA_STATE_NAMES_FOR_COUNTRY.has(normStateName(state))) return 'India';
  return 'Unknown';
}

export function buildDataFromRecords(records) {
  const STATES_new = uniqSortedJS(records.map(r => r.state));
  const CITIES_new = uniqSortedJS(records.map(r => r.city));
  const GENDER_new = ['Female', 'Male', 'Other'];
  const RHYTHM_new = ['Irregular', 'Regular'];
  const SAMA_new = ['Nirama', 'Sama'];
  const MANDA_new = ['Manda', 'Vegawati'];
  const DOSHA_new = uniqSortedJS(records.flatMap(r => [r.virkriti, r.prakriti]));
  const ISSUES_new = uniqSortedJS(records.map(r => r.issue));
  const COUNTRIES_new = uniqSortedJS(records.map(r => normCountryJS(r.country, r.state)));
  const NAMES_new = records.map(r => r.name || ('Patient ' + r.patient_id));

  const idxOf = arr => Object.fromEntries(arr.map((s, i) => [s, i]));
  const stateI = idxOf(STATES_new), cityI = idxOf(CITIES_new), genderI = idxOf(GENDER_new);
  const rhythmI = idxOf(RHYTHM_new), snI = idxOf(SAMA_new), mvI = idxOf(MANDA_new);
  const doshaI = idxOf(DOSHA_new), issueI = idxOf(ISSUES_new), countryI = idxOf(COUNTRIES_new);

  const ROWS_new = records.map(r => [
    r.lat, r.lon, stateI[r.state], cityI[r.city], r.age,
    r.height, r.weight, r.bmi, genderI[normGenderJS(r.gender)],
    r.pulse, rhythmI[r.rhythm], snI[r.sama_nirama], mvI[r.manda_vegawati],
    r.bala, r.agni, doshaI[r.virkriti], doshaI[r.prakriti], issueI[r.issue],
    r.medical_id, r.patient_id, r.doctor_id, r.date, r.time,
    countryI[normCountryJS(r.country, r.state)]
  ]);

  const DOSHA_COLORS = genColorsJS(DOSHA_new.length);
  const ISSUE_COLORS = genColorsJS(ISSUES_new.length);
  const oi = ISSUES_new.indexOf('Others');
  if (oi >= 0) ISSUE_COLORS[oi] = '#9E9689';

  return {
    states: STATES_new, cities: CITIES_new, gender: GENDER_new,
    rhythm: RHYTHM_new, samaNirama: SAMA_new, mandaVegawati: MANDA_new,
    doshaLabels: DOSHA_new, issues: ISSUES_new, names: NAMES_new,
    rows: ROWS_new, countries: COUNTRIES_new,
    doshaColors: DOSHA_COLORS, issueColors: ISSUE_COLORS,
  };
}
