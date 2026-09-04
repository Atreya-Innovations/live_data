import { useState, useEffect, useRef } from 'react';
import { GOOGLE_SHEET_CSV_URL, AUTO_REFRESH_MS, LS_DATA_KEY, LS_META_KEY } from '../constants/config.js';
import { SAMPLE_DATA } from '../constants/sampleData.js';

function loadFromCache() {
  try {
    const raw = localStorage.getItem(LS_DATA_KEY);
    const meta = localStorage.getItem(LS_META_KEY);
    if (raw && meta) return { data: JSON.parse(raw), meta: JSON.parse(meta) };
  } catch (e) {}
  return null;
}

function saveToCache(data, meta) {
  try { localStorage.setItem(LS_DATA_KEY, JSON.stringify(data)); localStorage.setItem(LS_META_KEY, JSON.stringify(meta)); } catch (e) {}
}

// Minimal CSV row parser — no XLSX dependency needed for the live Google Sheet CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV too short');
  const parseRow = (line) => {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += line[i]; }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseRow(lines[0]).map(h => h.replace(/"/g,'').toLowerCase().replace(/[^a-z0-9_]/g,''));
  return { headers, rows: lines.slice(1).map(parseRow) };
}

function coerceNum(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function coerceInt(v) { const n = parseInt(v, 10); return isNaN(n) ? null : n; }
function normGender(g) {
  if (!g) return 'Other';
  const s = String(g).toLowerCase();
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('m')) return 'Male';
  return 'Other';
}
function normDosha(raw) {
  if (!raw) return 'Not Recorded';
  const s = String(raw).trim();
  if (!s) return 'Not Recorded';
  const map = { p:'Pitta',v:'Vata',k:'Kapha','vp':'Vata-Pitta','pv':'Pitta-Vata','kp':'Kapha-Pitta','pk':'Pitta-Kapha','vk':'Vata-Kapha','kv':'Kapha-Vata' };
  const lk = s.toLowerCase().replace(/\s+/g,'-');
  for (const [k,v] of Object.entries(map)) { if (lk === k) return v; }
  if (s.length > 40) return 'Not Recorded';
  return s;
}
function normRhythm(r) { return String(r||'').toLowerCase().includes('irreg') ? 'Irregular' : 'Regular'; }
function normSama(s) { return String(s||'').toLowerCase().includes('nirama') ? 'Nirama' : 'Sama'; }
function normManda(m) { const s = String(m||'').toLowerCase(); return (s.includes('vegawati')||s.includes('vegavati')) ? 'Vegawati' : 'Manda'; }
function classifyIssue(text) {
  if (!text || String(text).trim()==='') return 'Others';
  const known = ['Acne','Anaemia','Anxiety','Asthama','Cancer','Constipation','Diabetes','Fever','Gout','Heart disease','Hypertension','Hypothyroidism','IBS','Indigestion','Infertility','Migraine','Obesity','PCOS','Piles','Psoriasis','Sciatica','Sinusitis'];
  const t = String(text).toLowerCase();
  for (const k of known) { if (t.includes(k.toLowerCase())) return k; }
  return 'Others';
}

function ci(headers, ...aliases) {
  for (const h of headers) {
    for (const a of aliases) { if (h === a || h.includes(a)) return headers.indexOf(h); }
  }
  return -1;
}

function buildDataFromCSV(csvText) {
  const { headers, rows } = parseCSV(csvText);
  
  const colLat = ci(headers,'latitude','lat');
  const colLon = ci(headers,'longitude','lon','lng');
  const colState = ci(headers,'state');
  const colCity = ci(headers,'city');
  const colAge = ci(headers,'age');
  const colGender = ci(headers,'gender');
  const colHeight = ci(headers,'height','heightcm');
  const colWeight = ci(headers,'weight','weightkg');
  const colBmi = ci(headers,'bmi');
  const colPulse = ci(headers,'pulserate','nadipulse','pulse');
  const colRhythm = ci(headers,'rhythm','nadirhythm');
  const colSama = ci(headers,'samanirama','sama');
  const colManda = ci(headers,'mandavegavati','manda');
  const colBala = ci(headers,'bala');
  const colAgni = ci(headers,'agni');
  const colVikruti = ci(headers,'vikruti','vikriti','virkriti');
  const colPrakriti = ci(headers,'patientprakruti','prakruti','prakriti');
  const colIssue = ci(headers,'majorsymptomsclassified','majorsymptoms','majorissue');
  const colDate = ci(headers,'reportdate');
  const colTime = ci(headers,'reporttime');
  const colMid = ci(headers,'medicalid','medical_id');
  const colPid = ci(headers,'patientid','patient_id');
  const colCountry = ci(headers,'country');
  const colName = ci(headers,'customername','patientname');
  const colDid = ci(headers,'doctorid','doctor_id');

  const statesSet=new Set(), citiesSet=new Set(), genderSet=new Set(['Female','Male','Other']);
  const rhythmSet=new Set(['Irregular','Regular']), samaSet=new Set(['Nirama','Sama']);
  const mandaSet=new Set(['Manda','Vegawati']), doshaSet=new Set(), issueSet=new Set(), countrySet=new Set();
  const names=[];

  const raw = rows.map((row,ri) => {
    const state = (colState>=0 && row[colState]) ? row[colState].trim() : 'Unknown';
    const city = (colCity>=0 && row[colCity]) ? row[colCity].trim() : 'Unknown';
    const gender = normGender(colGender>=0 ? row[colGender] : '');
    const rhythm = normRhythm(colRhythm>=0 ? row[colRhythm] : '');
    const sama = normSama(colSama>=0 ? row[colSama] : '');
    const manda = normManda(colManda>=0 ? row[colManda] : '');
    const vikruti = normDosha(colVikruti>=0 ? row[colVikruti] : null);
    const prakriti = normDosha(colPrakriti>=0 ? row[colPrakriti] : null);
    const issue = classifyIssue(colIssue>=0 ? row[colIssue] : null);
    const country = (colCountry>=0 && row[colCountry]) ? row[colCountry].trim() : 'India';
    const name = (colName>=0 && row[colName]) ? row[colName].trim() : ('Patient '+(ri+400000));
    statesSet.add(state); citiesSet.add(city); doshaSet.add(vikruti); doshaSet.add(prakriti);
    issueSet.add(issue); countrySet.add(country); names.push(name);
    return {
      lat: coerceNum(colLat>=0 ? row[colLat] : null),
      lon: coerceNum(colLon>=0 ? row[colLon] : null),
      state, city,
      age: coerceInt(colAge>=0 ? row[colAge] : null) || 45,
      height: coerceNum(colHeight>=0 ? row[colHeight] : null) || 165,
      weight: coerceNum(colWeight>=0 ? row[colWeight] : null) || 65,
      bmi: coerceNum(colBmi>=0 ? row[colBmi] : null) || 23.5,
      gender, pulse: coerceNum(colPulse>=0 ? row[colPulse] : null) || 72,
      rhythm, sama_nirama: sama, manda_vegawati: manda,
      bala: coerceNum(colBala>=0 ? row[colBala] : null) || 50,
      agni: coerceNum(colAgni>=0 ? row[colAgni] : null) || 50,
      vikruti, prakriti, issue, country,
      medical_id: coerceInt(colMid>=0 ? row[colMid] : null) || (ri+400000),
      patient_id: colPid>=0 ? row[colPid] : (ri+400000),
      doctor_id: colDid>=0 ? row[colDid] : 'Doctor',
      date: (colDate>=0 && row[colDate]) ? row[colDate] : '2026-08-01',
      time_str: (colTime>=0 && row[colTime]) ? row[colTime] : '12:00 PM',
    };
  }).filter(r => r.state && r.city);

  const STATES = [...statesSet].sort();
  const CITIES = [...citiesSet].sort();
  const GENDER = ['Female','Male','Other'];
  const RHYTHM = ['Irregular','Regular'];
  const SAMA = ['Nirama','Sama'];
  const MANDA = ['Manda','Vegawati'];
  const DOSHA = [...doshaSet].filter(Boolean).sort();
  const ISSUES = [...issueSet].filter(Boolean).sort();
  const COUNTRIES = [...countrySet].filter(Boolean).sort();

  const sIdx=Object.fromEntries(STATES.map((s,i)=>[s,i]));
  const cIdx=Object.fromEntries(CITIES.map((c,i)=>[c,i]));
  const gIdx=Object.fromEntries(GENDER.map((g,i)=>[g,i]));
  const rIdx=Object.fromEntries(RHYTHM.map((r,i)=>[r,i]));
  const snIdx=Object.fromEntries(SAMA.map((s,i)=>[s,i]));
  const mvIdx=Object.fromEntries(MANDA.map((m,i)=>[m,i]));
  const dIdx=Object.fromEntries(DOSHA.map((d,i)=>[d,i]));
  const iIdx=Object.fromEntries(ISSUES.map((i,idx)=>[i,idx]));
  const ctIdx=Object.fromEntries(COUNTRIES.map((c,i)=>[c,i]));

  // Build rows in the IDX-indexed format
  // IDX = {lat:0,lon:1,state:2,city:3,age:4,height_cm:5,weight_kg:6,bmi:7,gender:8,pulse:9,
  //         rhythm:10,sama_nirama:11,manda_vegawati:12,bala_pct:13,agni_pct:14,
  //         virkriti:15,prakriti:16,issue:17,medical_id:18,patient_id:19,doctor_id:20,
  //         date:21,time:22,country:23,approx:24}
  const ROWS = raw.map(r => [
    r.lat, r.lon, sIdx[r.state]??0, cIdx[r.city]??0, r.age,
    r.height, r.weight, r.bmi, gIdx[r.gender]??2,
    r.pulse, rIdx[r.rhythm]??1, snIdx[r.sama_nirama]??0, mvIdx[r.manda_vegawati]??0,
    r.bala, r.agni, dIdx[r.vikruti]??0, dIdx[r.prakriti]??0, iIdx[r.issue]??0,
    r.medical_id, r.patient_id, r.doctor_id, r.date, r.time_str, ctIdx[r.country]??0, 0
  ]);

  // Palette gen
  const PAL=['#3186CC','#D9463C','#4CA35B','#E89B2F','#9B59B6','#1ABC9C','#E74C3C','#2ECC71','#F39C12','#8E44AD','#16A085','#C0392B'];
  const genPal = n => Array.from({length:n},(_,i)=>PAL[i%PAL.length]);
  const DOSHA_COLORS = genPal(DOSHA.length);
  const ISSUE_COLORS = genPal(ISSUES.length);
  const oi = ISSUES.indexOf('Others');
  if (oi>=0) ISSUE_COLORS[oi]='#9E9689';

  return { states:STATES, cities:CITIES, gender:GENDER, rhythm:RHYTHM, samaNirama:SAMA,
    mandaVegawati:MANDA, doshaLabels:DOSHA, issues:ISSUES, names, rows:ROWS,
    countries:COUNTRIES, doshaColors:DOSHA_COLORS, issueColors:ISSUE_COLORS };
}

function buildFromSample() {
  // SAMPLE_DATA is already in the indexed format from the original HTML
  const data = {
    states: SAMPLE_DATA.states || [],
    cities: SAMPLE_DATA.cities || [],
    gender: SAMPLE_DATA.gender || ['Female','Male','Other'],
    rhythm: SAMPLE_DATA.rhythm || ['Irregular','Regular'],
    samaNirama: SAMPLE_DATA.samaNirama || ['Nirama','Sama'],
    mandaVegawati: SAMPLE_DATA.mandaVegawati || ['Manda','Vegawati'],
    doshaLabels: SAMPLE_DATA.doshaLabels || [],
    issues: SAMPLE_DATA.issues || [],
    names: SAMPLE_DATA.names || [],
    rows: (SAMPLE_DATA.rows || []).map(r => [...r, 0]), // add approx col
    countries: SAMPLE_DATA.countries || [],
    doshaColors: [],
    issueColors: [],
  };
  // Fill missing coords using simple city-average approach
  const cityAgg = {};
  data.rows.forEach(r => {
    if (r[0] != null && r[1] != null && !isNaN(r[0]) && !isNaN(r[1])) {
      const cn = data.cities[r[3]];
      if (cn && cn !== 'Unknown') {
        const a = cityAgg[cn] || (cityAgg[cn] = {la:0,lo:0,n:0});
        a.la += r[0]; a.lo += r[1]; a.n++;
      }
    }
  });
  data.rows.forEach((r, i) => {
    if (r[0] != null && r[1] != null && !isNaN(r[0]) && !isNaN(r[1])) return;
    const cn = data.cities[r[3]];
    const agg = cn ? cityAgg[cn] : null;
    if (agg && agg.n > 0) {
      const ang = (i*2.399963)%(Math.PI*2), rad = 0.055*Math.sqrt((i*0.618034)%1);
      r[0] = agg.la/agg.n + rad*Math.sin(ang);
      r[1] = agg.lo/agg.n + rad*Math.cos(ang);
      r[24] = 1;
    }
  });
  return data;
}

let memoizedSample = null;
function getInitialData() {
  const cached = loadFromCache();
  if (cached && cached.data) return cached.data;
  if (!memoizedSample) memoizedSample = buildFromSample();
  return memoizedSample;
}

export function useGoogleSheet() {
  const [data, setData] = useState(getInitialData);
  const [status, setStatus] = useState(() => {
    const cached = loadFromCache();
    if (cached && cached.data) {
      return `Cached data — ${(cached.meta?.count || cached.data.rows?.length || 0).toLocaleString()} readings · refreshing…`;
    }
    return 'Connecting to Google Sheet…';
  });
  const timerRef = useRef(null);

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setStatus(prev => prev.includes('refreshing') ? prev : prev.replace(/· refreshed.*$/, '· refreshing…'));
      }
      const res = await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csvText = await res.text();
      if (!csvText || csvText.trim().length < 100) throw new Error('Empty CSV');
      const fresh = buildDataFromCSV(csvText);
      saveToCache(fresh, { ts: Date.now(), count: fresh.rows.length });
      setData(fresh);
      setStatus(`Live from Google Sheet — ${fresh.rows.length.toLocaleString()} readings · refreshed ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.warn('Sheet fetch failed:', err.message);
      const cached = loadFromCache();
      if (cached && !isRefresh) {
        setData(cached.data);
        setStatus(`Cached data — ${(cached.meta?.count || 0).toLocaleString()} readings · fetched ${new Date(cached.meta?.ts).toLocaleDateString()}`);
      } else if (!isRefresh) {
        setStatus(`Showing embedded sample data (fetch failed: ${err.message})`);
      } else {
        setStatus(prev => prev.includes('refresh failed') ? prev : prev + ' (refresh failed)');
      }
    }
  }

  useEffect(() => {
    loadData(false);
    timerRef.current = setInterval(() => loadData(true), AUTO_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return { data, status };
}
