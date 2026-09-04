# Agent.md — Atreya Innovations Nadi Tarangini Heatmap
> **The Living Operational Runbook & Knowledge Base for AI Agents**  
> **Last Updated:** 2026-09-04 | **Status:** ✅ Production Live & Stable

---

## 🚨 CRITICAL RULE: DO NOT USE GIT

> [!CAUTION]
> **THIS PROJECT IS NOT A GIT REPOSITORY.**
> - **NEVER run `git` commands** (e.g. `git status`, `git diff`, `git log`, `git commit`, `git add`, `git push`, `git checkout`).
> - The user does not use Git for this project; running git commands causes permission denial or errors.
> - Work directly on the local filesystem in `c:\Users\User\Downloads\Aditya_data\live_data_react\`.
> - Always record code changes and milestone summaries directly in the **Update Log** in this file (`agent.md`).

---

## 🧭 Project Identity & Endpoints

| Field | Value | Notes |
|---|---|---|
| **Project Name** | Nadi Tarangini — India Device Intelligence Map | Digital pulse diagnostics heatmap |
| **Client / Owner** | Atreya Innovations | Pulse diagnostics hardware & software |
| **Live Production URL** | https://livedatant.vercel.app/ | Primary live dashboard |
| **Vercel Project** | `adityakaushik-4581/live_data_react` | Production deployment target |
| **Google Sheet (CSV)** | [Published CSV Endpoint](https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_Pt5EAFx1hScFqcFQ-Qcniyin0GSZXx9d1mcDynl3G1i-CtHp9jdxQCuzxwNmJydlEWR20cf5Ko8B/pub?output=csv) | Sole live data source |
| **Google Sheet (Edit)** | [Edit Link (Drive)](https://docs.google.com/spreadsheets/d/1hNM3knPWiRq3oMEWz2Xlb2-bvyav0kgxnWPict61DrY/edit?usp=drive_link) | For manager reference |
| **Active Workspace** | `c:\Users\User\Downloads\Aditya_data\live_data_react\` | React 19 + Vite 8 workspace |
| **Legacy HTML** | `c:\Users\User\Downloads\Aditya_data\live_data_me\` | **DO NOT TOUCH** (Reference only) |

---

## 📌 The 7 Immutable Commandments for the Agent

1. **NO GIT COMMANDS** — Never run `git status`, `git diff`, or any Git commands.
2. **NEVER TOUCH `live_data_me/`** — The original HTML version in `live_data_me/` is strictly read-only and preserved for archival reference.
3. **SINGLE DATA SOURCE** — Data originates exclusively from the published Google Sheet CSV (`VITE_GOOGLE_SHEET_CSV_URL`). Never add manual upload buttons, local file pickers, or secondary databases.
4. **ALWAYS BUILD BEFORE DEPLOY** — Run `npm run build` first. It must pass with 0 errors before initiating any Vercel deployment.
5. **PRESERVE THE IDW WEATHER FIELD** — The Leaflet visualization is a continuous Gaussian-style Inverse Distance Weighted (IDW) canvas interpolation clipped to India's GeoJSON boundary, not simple pin markers.
6. **UPDATE THIS RUNBOOK** — Every time you make changes, solve a bug, or receive new manager requirements, update `agent.md` and `work.md`.
7. **CHRONOLOGICAL UPDATE LOG** — Always place the newest change at the top of the Update Log table below.

---

## 📦 What the Manager Provides

### ✅ Currently Provided & Active
| # | Resource | Details | Status |
|---|---|---|---|
| 1 | **Google Sheet CSV Link** | Published CSV endpoint feeding live device readings | ✅ Active & Ingesting |
| 2 | **Google Sheet Edit Link** | Master Google Sheet link for data verification | ✅ Active |
| 3 | **Vercel Account & Domain** | Logged in via browser (`adityakaushik-4581`), custom domain `livedatant.vercel.app` | ✅ Deployed & Live |
| 4 | **India GeoJSON Boundaries** | Complete polygon boundaries for Indian states in `src/constants/indiaGeo.js` | ✅ Active |
| 5 | **Embedded Sample Fallback** | Baseline records in `src/constants/sampleData.js` for zero-latency initial paint | ✅ Active |

### 📋 What to Add When the Manager Shares New Resources
When the manager provides new assets or requirements, document them here:
- **New Google Sheet URL:** Update `VITE_GOOGLE_SHEET_CSV_URL` in `.env` and `src/constants/config.js`.
- **New Data Columns:** Map column names in `src/hooks/useGoogleSheet.js` fuzzy alias matcher (`ci()`).
- **New Diagnostic Parameters:** Register them in `src/constants/paramDefs.js`.
- **New UI Designs / Requirements:** Document below and verify with manager.

---

## 🗂 Workspace Structure & Key Files

```
live_data_react/
├── agent.md                  ← YOU ARE HERE: Master Operational Runbook
├── work.md                   ← Full Technical Architecture & Mathematical Specs
├── .env                      ← Live CSV URL and refresh configuration
├── package.json              ← React 19, Leaflet, Vite 8, Oxlint
├── vercel.json               ← Build command and client-side routing rewrites
├── index.html                ← Single-page entry and Leaflet CDN scripts
└── src/
    ├── main.jsx              ← React entry
    ├── App.jsx               ← Top-level state coordinator & ErrorBoundary
    ├── index.css             ← Atreya dark maroon theme & layout styles
    ├── hooks/
    │   └── useGoogleSheet.js ← Live fetch, pure JS CSV parser, caching & auto-refresh
    ├── constants/
    │   ├── config.js         ← Environment variable readers & cache keys
    │   ├── paramDefs.js      ← Metric schema, IDX map, parameter groups & color definitions
    │   ├── indiaGeo.js       ← India state GeoJSON boundaries (~113 KB)
    │   ├── cityData.js       ← City gazetteer, coordinates, tiers, regional mappings
    │   ├── sampleData.js     ← Cold-start embedded sample dataset (~340 KB)
    │   └── symptoms.js       ← Clinical symptom classification mappings
    ├── utils/
    │   ├── kernelInterp.js   ← IDW weather field calculation, regional weighting, Path2D canvas mask
    │   ├── geoUtils.js       ← Missing coordinate imputation & spiral jitter
    │   ├── filterUtils.js    ← Age, Prahar, BMI, State, and Country filter algorithms
    │   ├── colorUtils.js     ← Color scales & logarithmic transformations
    │   └── reportCard.js     ← Clinical patient summary tooltip formatter
    └── components/
        ├── Header.jsx        ← Brand header
        ├── Controls.jsx      ← Multi-factor filter controls & dynamic category selectors
        ├── MultiSelect.jsx   ← Dropdown checkbox selector
        ├── DataStatus.jsx    ← Live sync status strip
        ├── StatsRow.jsx      ← 5 reactive KPI stat cards
        ├── Footer.jsx        ← Footer with reading counts
        ├── MapPanel/
        │   ├── MapPanel.jsx  ← Map container header with reading counts & zoom
        │   ├── HeatMap.jsx   ← Leaflet map lifecycle, panes & canvas renderer
        │   └── Legend.jsx    ← Continuous gradient or categorical color legend
        └── LowerGrid/
            ├── LowerGrid.jsx ← Two-column lower section container
            ├── StateRanking.jsx ← Top 10 states ranking bar charts
            └── Glossary.jsx  ← Interactive Ayurvedic parameter glossary
```

---

## 🧩 Ingestion & Data Model Reference

### The 25-Element Row Schema (`IDX`)
Data rows in memory are stored as compact 25-index arrays for high rendering speed:
```
Index  Field            Type         Notes / Mapping
-----  ---------------  -----------  ---------------------------------------------
0      lat              Float/null   Latitude (actual or imputed)
1      lon              Float/null   Longitude (actual or imputed)
2      state            Integer      Index into data.states
3      city             Integer      Index into data.cities
4      age              Integer      Patient age (years)
5      height_cm        Float        Height in cm
6      weight_kg        Float        Weight in kg
7      bmi              Float        Body Mass Index
8      gender           Integer      0: Female, 1: Male, 2: Other
9      pulse            Float        Pulse rate in bpm
10     rhythm           Integer      0: Irregular, 1: Regular
11     sama_nirama      Integer      0: Nirama, 1: Sama
12     manda_vegawati   Integer      0: Manda, 1: Vegawati
13     bala_pct         Float        Pulse Strength (0 - 100%)
14     agni_pct         Float        Digestive Fire (0 - 100%)
15     virkriti         Integer      Current imbalance index in data.doshaLabels
16     prakriti         Integer      Constitutional index in data.doshaLabels
17     issue            Integer      Classified symptom index in data.issues
18     medical_id       Integer/Str  Unique reading medical ID
19     patient_id       String       Patient ID
20     doctor_id        String       Doctor ID
21     date             String       Reading date (YYYY-MM-DD)
22     time             String       Reading time (HH:MM AM/PM)
23     country          Integer      Index into data.countries
24     approx           Integer      0 = Real GPS, 1 = Imputed via gazetteer/spiral
```

---

## 🐛 Known Pitfalls & Solutions

| Issue Encountered | Root Cause | Permanent Resolution |
|---|---|---|
| **Git command errors** | Project directory is not a git repo. | **Do not run git commands.** Track work in `agent.md`. |
| **`DOSHA_COLORS is not defined`** | `PARAM_DEFS` referenced color array before declaration in `paramDefs.js`. | Declared `DOSHA_COLORS` and `ISSUE_COLORS` above `PARAM_DEFS`. |
| **Blank screen on Vercel** | Ingestion depended on `window.XLSX` CDN script which had not finished loading. | Implemented standalone pure JS CSV parser in `useGoogleSheet.js` with zero dependencies. |
| **Leaflet canvas z-index conflicts** | Overlay canvas sat under tiles or covered state boundaries. | Built custom panes (`statesPane`: 300, `interpPane`: 350, `bordersPane`: 380). |
| **Point clustering / stacking** | Multiple patients from same city shared identical coordinates. | Added golden-angle spiral jitter in `geoUtils.js` to spread points naturally. |
| **Vercel SSO gatekeeping** | Default team Vercel project had preview deployment protection enabled. | Disabled Vercel SSO protection on project dashboard. |

---

## 🚀 Step-by-Step Deployment Guide

```bash
# 1. Verify working directory
# Must be in c:\Users\User\Downloads\Aditya_data\live_data_react

# 2. Verify code quality (optional)
npm run lint

# 3. Build production bundle (MANDATORY)
npm run build
# Ensure build finishes with code 0 and dist/ is populated

# 4. Deploy to Vercel production
npx vercel --prod --yes

# 5. Domain aliasing (if needed)
npx vercel alias <deployment-url> livedatant.vercel.app
```

---

## 📋 Active Tasks & Backlog

| Priority | Task | Status | Notes |
|---|---|---|---|
| 🟢 HIGH | Verify live site stability and CSV data sync | ✅ Verified | https://livedatant.vercel.app/ running clean |
| 🟢 HIGH | Project Analysis & Documentation Overhaul | ✅ Completed | `work.md` & `agent.md` fully comprehensive with NO-GIT rule |
| 🟡 MED | Monitor 5-min auto-refresh interval behavior | ⏳ Ongoing | Verifying silent background updates without UI flicker |
| ⚪ LOW | Performance audit for IDW rendering at high zoom levels | 💡 Future | Grid resolution scales dynamically from 40 to 190 cells |

---

## 📝 Chronological Update Log

> *Every modification made to the project is recorded here, newest first.*

### 2026-09-04 (Documentation & Architectural Overhaul)
| Time | Action | Details | Agent |
|---|---|---|---|
| 22:37 | **Production Deployment to Vercel** | Successfully deployed optimized release to Vercel production (`https://livedatareact.vercel.app` and `https://livedatareact-4eqbiehn5-adityakaushik-4581.vercel.app`). | Antigravity AI |
| 22:34 | **Eliminated Zoom & Pan Delays** | Spatially bounded samples to visible viewport (+margin), added $O(1)$ spatial LUT for `nearestMajorCity`, pre-computed India GeoJSON bounding boxes for polygon culling, pre-compiled 32-bit pixel LUT (`COLOR_LUT_32`) for zero-allocation Uint32Array writing, direct `ctx.clip(path)` (eliminating multi-MB mask canvas), and debounced redraws via `requestAnimationFrame`. | Antigravity AI |
| 22:32 | **Eliminated Initial Loading Delay** | Removed 1.4 MB of blocking external `<head>` scripts (`xlsx.full.min.js`, `leaflet-heat.js`), bundled Leaflet directly via Vite (`import L from 'leaflet'`), and converted `useGoogleSheet` state initialization to synchronous cache/sample hydration on frame 0. | Antigravity AI |
| 22:04 | **Comprehensive Runbook Update (`agent.md`)** | Overhauled `agent.md` with explicit NO-GIT warning, 7 Commandments, IDX memory schema, and deployment SOP. | Antigravity AI |
| 22:03 | **System Specification Update (`work.md`)** | Overhauled `work.md` with deep mathematical explanation of IDW, React 19 tech stack, data pipeline, and missing GPS imputation. | Antigravity AI |
| 22:01 | **Repository Health & Build Verification** | Ran `npm run build` (passed: 674 KB bundle) and `npm run lint` (0 errors). | Antigravity AI |
| 21:59 | **Identified Git Constraint** | User confirmed project is NOT on Git; codified rule that agents must never execute Git commands. | Antigravity AI |
| 02:16 | **Fixed DOSHA_COLORS Reference Error** | Fixed `PARAM_DEFS` reference error in `paramDefs.js`, tested build, and redeployed to Vercel. | Antigravity AI |
| 02:05 | **Eliminated CDN XLSX Dependency** | Rewrote `useGoogleSheet.js` with pure JS CSV parsing (`parseCSV`) to eliminate CDN race condition causing blank page. | Antigravity AI |
| 02:01 | **Vercel Aliasing & Production Deployment** | Pointed `livedatant.vercel.app` to React application deployment on Vercel. | Antigravity AI |
| 01:58 | **React Component Architecture Built** | Created all components: Header, Controls, MultiSelect, DataStatus, StatsRow, MapPanel, LowerGrid, Footer. | Antigravity AI |
| 01:45 | **Scaffolded React Project** | Scaffolded Vite project in `live_data_react/` and extracted constants from legacy HTML. | Antigravity AI |

### 2026-09-03 (Legacy HTML Phase)
| Time | Action | Details | Done By |
|---|---|---|---|
| Evening | Removed manual buttons | Stripped manual upload and refresh buttons; bound directly to Google Sheet CSV. | Agent |
| Evening | Created `.env` & `work.md` | Configured environment variables and documentation in `live_data_me/`. | Agent |
| Evening | Provided Sheet URLs | Manager shared published CSV endpoint and edit link. | Manager |

---

## 💬 Manager Instructions Format

When the manager provides new inputs or modifications, document them in this format:

```markdown
### [YYYY-MM-DD] — Manager Instruction
- **Requirement:** Describe what needs to be changed or added
- **Resource Provided:** Any new links, spreadsheets, or designs
- **Priority:** HIGH / MEDIUM / LOW
- **Action Plan:** Bullet points of implementation steps
```
