// ============================================================
// DASHBOARD CONFIGURATION — Schema-driven, no hardcoded values
// ============================================================

export const CLUSTER_CONFIG = {
  Bongaigaon: {
    color: '#4a7c59',
    colorLight: '#a8d5b5',
    colorDark: '#2d5c3a',
    gradient: 'from-green-800 to-green-600',
    accent: '#6dbf82',
    textColor: '#ffffff',
    label: 'Bongaigaon Cluster',
    ulbCount: 6,
  },
  Tezpur: {
    color: '#2563eb',
    colorLight: '#93c5fd',
    colorDark: '#1e3a8a',
    gradient: 'from-blue-800 to-blue-600',
    accent: '#60a5fa',
    textColor: '#ffffff',
    label: 'Tezpur Cluster',
    ulbCount: 8,
  },
  Nagaon: {
    color: '#d97706',
    colorLight: '#fcd34d',
    colorDark: '#92400e',
    gradient: 'from-amber-800 to-amber-600',
    accent: '#fbbf24',
    textColor: '#ffffff',
    label: 'Nagaon Cluster',
    ulbCount: 7,
  },
  Sivasagar: {
    color: '#7c3aed',
    colorLight: '#c4b5fd',
    colorDark: '#4c1d95',
    gradient: 'from-violet-800 to-violet-600',
    accent: '#a78bfa',
    textColor: '#ffffff',
    label: 'Sivasagar Cluster',
    ulbCount: 5,
  },
  Dibrugarh: {
    color: '#db2777',
    colorLight: '#f9a8d4',
    colorDark: '#831843',
    gradient: 'from-pink-800 to-pink-600',
    accent: '#f472b6',
    textColor: '#ffffff',
    label: 'Dibrugarh Cluster',
    ulbCount: 5,
  },
  Silchar: {
    color: '#ca8a04',
    colorLight: '#fde68a',
    colorDark: '#713f12',
    gradient: 'from-yellow-800 to-yellow-600',
    accent: '#facc15',
    textColor: '#ffffff',
    label: 'Silchar Cluster',
    ulbCount: 4,
  },
  Haflong: {
    color: '#0d9488',
    colorLight: '#99f6e4',
    colorDark: '#134e4a',
    gradient: 'from-teal-800 to-teal-600',
    accent: '#2dd4bf',
    textColor: '#ffffff',
    label: 'Haflong Cluster',
    ulbCount: 4,
  },
};

export const STATUS_CONFIG = {
  Completed: {
    color: '#10b981',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    dot: '#10b981',
    label: 'Completed',
  },
  Ongoing: {
    color: '#f59e0b',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    dot: '#f59e0b',
    label: 'Ongoing',
  },
  'Not Yet Started': {
    color: '#ef4444',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/40',
    dot: '#ef4444',
    label: 'Not Yet Started',
  },
};

export const KPI_SCHEMA = [
  {
    id: 'total_dpr_waste',
    label: 'Total DPR Waste Target',
    unit: 'MT',
    icon: 'trash-2',
    color: '#60a5fa',
    computeFrom: (ulbs) =>
      ulbs.reduce((s, u) => s + (u.vol_dpr || 0), 0),
    format: (v) => (v / 1000).toFixed(1) + 'K MT',
  },
  {
    id: 'total_processed',
    label: 'Total Waste Processed',
    unit: 'MT',
    icon: 'check-circle',
    color: '#34d399',
    computeFrom: (ulbs) =>
      ulbs.reduce((s, u) => s + (u.vol_processed || 0), 0),
    format: (v) => (v / 1000).toFixed(1) + 'K MT',
  },
  {
    id: 'processing_pct',
    label: 'Overall Processing %',
    unit: '%',
    icon: 'trending-up',
    color: '#a78bfa',
    computeFrom: (ulbs) => {
      const dpr = ulbs.reduce((s, u) => s + (u.vol_dpr || 0), 0);
      const proc = ulbs.reduce((s, u) => s + (u.vol_processed || 0), 0);
      return dpr > 0 ? (proc / dpr) * 100 : 0;
    },
    format: (v) => v.toFixed(1) + '%',
  },
  {
    id: 'area_target',
    label: 'Total Area Target',
    unit: 'Sqm',
    icon: 'map',
    color: '#fb923c',
    computeFrom: (ulbs) =>
      ulbs.reduce((s, u) => s + (u.area_dpr || 0), 0),
    format: (v) => (v / 1000).toFixed(1) + 'K Sqm',
  },
  {
    id: 'area_reclaimed',
    label: 'Area Reclaimed',
    unit: 'Sqm',
    icon: 'layers',
    color: '#2dd4bf',
    computeFrom: (ulbs) =>
      ulbs.reduce((s, u) => s + (u.area_actual || 0), 0),
    format: (v) => v.toLocaleString('en-IN') + ' Sqm',
  },
  {
    id: 'best_cluster',
    label: 'Best Performing Cluster',
    unit: '',
    icon: 'award',
    color: '#fbbf24',
    computeFrom: (ulbs) => {
      const clusters = {};
      ulbs.forEach((u) => {
        if (!clusters[u.cluster]) clusters[u.cluster] = { dpr: 0, proc: 0 };
        clusters[u.cluster].dpr += u.vol_dpr || 0;
        clusters[u.cluster].proc += u.vol_processed || 0;
      });
      let best = null, bestPct = -1;
      Object.entries(clusters).forEach(([k, v]) => {
        const pct = v.dpr > 0 ? (v.proc / v.dpr) * 100 : 0;
        if (pct > bestPct) { bestPct = pct; best = k; }
      });
      return best || '—';
    },
    format: (v) => v,
  },
  {
    id: 'worst_cluster',
    label: 'Needs Attention',
    unit: '',
    icon: 'alert-triangle',
    color: '#f87171',
    computeFrom: (ulbs) => {
      const clusters = {};
      ulbs.forEach((u) => {
        if (!clusters[u.cluster]) clusters[u.cluster] = { dpr: 0, proc: 0 };
        clusters[u.cluster].dpr += u.vol_dpr || 0;
        clusters[u.cluster].proc += u.vol_processed || 0;
      });
      let worst = null, worstPct = Infinity;
      Object.entries(clusters).forEach(([k, v]) => {
        const pct = v.dpr > 0 ? (v.proc / v.dpr) * 100 : 0;
        if (pct < worstPct) { worstPct = pct; worst = k; }
      });
      return worst || '—';
    },
    format: (v) => v,
  },
];

export const CHART_SCHEMA = {
  clusterComparison: {
    title: 'Cluster DPR vs Actual Processed',
    type: 'bar',
    metrics: ['vol_dpr', 'vol_processed'],
    labels: ['DPR Target', 'Actual Processed'],
  },
  completionRanking: {
    title: 'Cluster Completion Ranking',
    type: 'horizontalBar',
    metric: 'completion_pct',
  },
  monthlyTrend: {
    title: 'Monthly Waste Processing Trend',
    type: 'line',
    source: 'monthly',
  },
};

export const TABLE_COLUMNS = [
  { key: 'cluster', label: 'Cluster', sortable: true, filterable: true },
  { key: 'name', label: 'ULB Name', sortable: true, filterable: false },
  { key: 'vol_dpr', label: 'DPR Waste (MT)', sortable: true, format: 'number' },
  { key: 'vol_processed', label: 'Processed (MT)', sortable: true, format: 'number' },
  { key: 'vol_remaining', label: 'Remaining (MT)', sortable: true, format: 'number', computed: true },
  { key: 'area_dpr', label: 'DPR Area (Sqm)', sortable: true, format: 'number' },
  { key: 'area_actual', label: 'Reclaimed (Sqm)', sortable: true, format: 'number' },
  { key: 'area_remaining', label: 'Remaining (Sqm)', sortable: true, format: 'number', computed: true },
  { key: 'completion_pct', label: '% Complete', sortable: true, format: 'percentage', computed: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
];
