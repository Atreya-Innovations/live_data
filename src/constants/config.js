// Central config — reads from .env (VITE_ prefix required for Vite)
export const GOOGLE_SHEET_CSV_URL =
  import.meta.env.VITE_GOOGLE_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_Pt5EAFx1hScFqcFQ-Qcniyin0GSZXx9d1mcDynl3G1i-CtHp9jdxQCuzxwNmJydlEWR20cf5Ko8B/pub?output=csv';

export const AUTO_REFRESH_MS = Number(import.meta.env.VITE_AUTO_REFRESH_MS) || 300000;

export const GOOGLE_SHEET_EDIT_URL =
  'https://docs.google.com/spreadsheets/d/1hNM3knPWiRq3oMEWz2Xlb2-bvyav0kgxnWPict61DrY/edit?usp=drive_link';

export const LS_DATA_KEY = 'atreya_heatmap_data_v1';
export const LS_META_KEY = 'atreya_heatmap_meta_v1';
