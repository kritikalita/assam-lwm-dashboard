# Assam LWM Mission Monitoring Dashboard

**DMA, Government of Assam** — Legacy Waste Management mission tracking across 7 clusters and 39 ULBs.

Built with React + Vite. Static frontend, no backend required.

---

## Quick Start (local)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Update data

Replace `src/data/lwm_data.json` with your actual monthly data. All KPIs, map, table, and progress bar update automatically.

Data schema:
```json
{
  "months": ["Jan-25", "Feb-25", ...],
  "ulbs": [{
    "cluster": "Bongaigaon",
    "name": "Howly Municipal Board",
    "vol_dpr": 1460,
    "vol_3rd_party": 0,
    "vol_processed": 1572.73,
    "area_dpr": 1395,
    "area_actual": 0,
    "status": "Ongoing",
    "lat": 26.4125,
    "lng": 91.0112,
    "monthly": [
      { "month": "Jan-25", "vol_processed": 0, "status": "Not Yet Started" },
      { "month": "Jun-25", "vol_processed": 1572.73, "status": "Ongoing" }
    ]
  }]
}
```

Monthly `vol_processed` values must be **incremental** (MT processed in that month only, not cumulative).

---

## Deploy to GitHub Pages

### One-time setup

1. Push this repo to GitHub (e.g. `github.com/yourorg/assam-lwm-dashboard`)

2. Install the deploy package:
```bash
npm install -D gh-pages
```

3. Add to `package.json` under `"scripts"`:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

4. In GitHub: **Settings → Pages → Source → Deploy from branch → `gh-pages` → / (root)**

### Deploy

```bash
npm run deploy
```

Your dashboard will be live at:
`https://yourorg.github.io/assam-lwm-dashboard/`

### Re-deploy after data update

Edit `src/data/lwm_data.json`, then:
```bash
npm run deploy
```

---

## Cluster colour key

| Cluster | Colour |
|---|---|
| Bongaigaon | #4a7c59 Green |
| Tezpur | #2563eb Blue |
| Nagaon | #d97706 Orange |
| Sivasagar | #7c3aed Purple |
| Dibrugarh | #db2777 Pink |
| Silchar | #ca8a04 Gold |
| Haflong | #0d9488 Teal |

---

*Built by Datavantage Advisory LLP for AIIB-funded Multimodal & Logistics Master Plan, Assam (PWRD/GoA)*
