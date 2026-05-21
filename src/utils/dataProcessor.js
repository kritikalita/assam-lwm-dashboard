// ============================================================
// DATA PROCESSOR — All calculations derived from raw data
// Replace lwm_data.json and everything updates automatically
// ============================================================

export function computeULBMetrics(ulb) {
  const volDPR = ulb.vol_dpr || 0;
  const volProcessed = ulb.vol_processed || 0;
  const areaDPR = ulb.area_dpr || 0;
  const areaActual = ulb.area_actual || 0;

  const completionPct = volDPR > 0 ? Math.min((volProcessed / volDPR) * 100, 100) : 0;
  const areaCompletionPct = areaDPR > 0 ? Math.min((areaActual / areaDPR) * 100, 100) : 0;

  let status = ulb.status || 'Not Yet Started';
  // Derive status from completion if not set
  if (completionPct >= 100) status = 'Completed';
  else if (completionPct > 0) status = 'Ongoing';
  else status = 'Not Yet Started';

  let statusColor = '#ef4444';
  if (status === 'Completed') statusColor = '#10b981';
  else if (status === 'Ongoing') statusColor = '#f59e0b';

  return {
    ...ulb,
    vol_remaining: Math.max(volDPR - volProcessed, 0),
    area_remaining: Math.max(areaDPR - areaActual, 0),
    completion_pct: completionPct,
    area_completion_pct: areaCompletionPct,
    status,
    statusColor,
  };
}

export function computeClusterMetrics(ulbs) {
  const clusterMap = {};
  ulbs.forEach((u) => {
    const c = u.cluster;
    if (!clusterMap[c]) {
      clusterMap[c] = {
        cluster: c,
        ulbs: [],
        vol_dpr: 0,
        vol_processed: 0,
        vol_remaining: 0,
        area_dpr: 0,
        area_actual: 0,
        area_remaining: 0,
      };
    }
    const m = computeULBMetrics(u);
    clusterMap[c].ulbs.push(m);
    clusterMap[c].vol_dpr += m.vol_dpr;
    clusterMap[c].vol_processed += m.vol_processed;
    clusterMap[c].vol_remaining += m.vol_remaining;
    clusterMap[c].area_dpr += m.area_dpr;
    clusterMap[c].area_actual += m.area_actual;
    clusterMap[c].area_remaining += m.area_remaining;
  });

  return Object.values(clusterMap).map((c) => {
    const completionPct = c.vol_dpr > 0 ? (c.vol_processed / c.vol_dpr) * 100 : 0;
    const areaCompletionPct = c.area_dpr > 0 ? (c.area_actual / c.area_dpr) * 100 : 0;
    let status = 'Not Yet Started';
    if (completionPct >= 100) status = 'Completed';
    else if (completionPct > 0) status = 'Ongoing';
    return { ...c, completion_pct: completionPct, area_completion_pct: areaCompletionPct, status };
  });
}

export function computeAssamTotals(ulbs) {
  return {
    vol_dpr: ulbs.reduce((s, u) => s + (u.vol_dpr || 0), 0),
    vol_processed: ulbs.reduce((s, u) => s + (u.vol_processed || 0), 0),
    vol_remaining: ulbs.reduce((s, u) => s + Math.max((u.vol_dpr || 0) - (u.vol_processed || 0), 0), 0),
    area_dpr: ulbs.reduce((s, u) => s + (u.area_dpr || 0), 0),
    area_actual: ulbs.reduce((s, u) => s + (u.area_actual || 0), 0),
    total_ulbs: ulbs.length,
  };
}

export function computeMonthlyTrend(ulbs, months) {
  return months.map((month) => {
    let total = 0;
    ulbs.forEach((u) => {
      const m = (u.monthly || []).find((x) => x.month === month);
      if (m) total += m.vol_processed || 0;
    });
    return { month, total };
  });
}

export function computeMonthlyTrendByCluster(ulbs, months) {
  const clusters = [...new Set(ulbs.map((u) => u.cluster))];
  return months.map((month) => {
    const entry = { month };
    clusters.forEach((c) => {
      let total = 0;
      ulbs.filter((u) => u.cluster === c).forEach((u) => {
        const m = (u.monthly || []).find((x) => x.month === month);
        if (m) total += m.vol_processed || 0;
      });
      entry[c] = total;
    });
    return entry;
  });
}

export function rankClusters(clusterMetrics) {
  return [...clusterMetrics].sort((a, b) => b.completion_pct - a.completion_pct);
}

export function getSmartInsights(ulbs, clusterMetrics) {
  const enriched = ulbs.map(computeULBMetrics);

  const topPerformers = enriched
    .filter((u) => u.vol_dpr > 0)
    .sort((a, b) => b.completion_pct - a.completion_pct)
    .slice(0, 3);

  const delayed = enriched.filter((u) => u.status === 'Not Yet Started' && u.vol_dpr > 1000);

  const criticalPending = enriched
    .filter((u) => u.vol_remaining > 0)
    .sort((a, b) => b.vol_remaining - a.vol_remaining)
    .slice(0, 5);

  const ranked = rankClusters(clusterMetrics);
  const bestCluster = ranked[0];
  const worstCluster = ranked[ranked.length - 1];

  return { topPerformers, delayed, criticalPending, bestCluster, worstCluster };
}

export function filterAndSortULBs(ulbs, { search, cluster, status, sortKey, sortDir }) {
  let result = ulbs.map(computeULBMetrics);

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (u) => u.name.toLowerCase().includes(q) || u.cluster.toLowerCase().includes(q)
    );
  }
  if (cluster && cluster !== 'All') {
    result = result.filter((u) => u.cluster === cluster);
  }
  if (status && status !== 'All') {
    result = result.filter((u) => u.status === status);
  }
  if (sortKey) {
    result.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }
  return result;
}
