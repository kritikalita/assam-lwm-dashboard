import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lwmData from './data/lwm_data.json';

const MONTHS = lwmData.months;
const CL_COLORS = {
  Bongaigaon:'#4a7c59', Tezpur:'#2563eb', Nagaon:'#d97706',
  Sivasagar:'#7c3aed', Dibrugarh:'#db2777', Silchar:'#ca8a04', Haflong:'#0d9488'
};
const CL_ORDER = ['Bongaigaon','Tezpur','Nagaon','Sivasagar','Dibrugarh','Silchar','Haflong'];
const CL_ID = {Bongaigaon:'bng',Tezpur:'tzp',Nagaon:'ngn',Sivasagar:'svs',Dibrugarh:'dbg',Silchar:'slc',Haflong:'hfg'};

const ULB_POS = {
  'Bongaigaon Municipal Board':[138,152],'Basugaon Municipal Board':[60,160],
  'Howly Municipal Board':[175,148],'Kokrajhar Municipal Board':[60,148],
  'Nalbari Municipal Board':[208,125],'Rangia Municipal Board':[220,116],
  'Tezpur Municipal Board (TMB)':[292,98],'Bihpuria Municipal Board (BMB)':[436,112],
  'Dhekiajuli Municipal Board':[412,98],'Gohpur Municipal Board':[448,86],
  'Kharupetia Municipal Board':[265,144],'Rangapara Municipal Board':[348,86],
  'Tangla Municipal Board':[305,152],'Bokakhat Municipal Board':[392,160],
  'Nagaon Municipal Board':[308,255],'Diphu Municipal Board':[372,335],
  'Bokajan Municipal Board':[398,318],'Hojai Municipal Board':[348,278],
  'Kampur Municipal Board':[368,244],'Morigaon Municipal Board':[265,244],
  'Raha Municipal Board':[292,254],'Sivasagar Municipal Board':[590,160],
  'Golaghat Municipal Board':[485,210],'Simaluguri Municipal Board':[542,124],
  'Sonari Municipal Board':[615,110],'Titabor Municipal Board':[515,185],
  'Dibrugarh Municipal Corporation (DMC)':[712,152],'Dhemaji Municipal Board':[682,108],
  'Digboi Municipal Board':[788,145],'Silapathar Municipal Board':[735,105],
  'Chabua Municipal Board':[749,162],'Silchar Municipal Board (SMB)':[442,442],
  'Hailakandi Municipal Board':[392,472],'Karimganj Municipal Board':[358,448],
  'Lakhipur Municipal Board':[488,462],'Haflong Municipal Board':[238,430],
  'Mahur Municipal Board':[265,452],'Maibong Municipal Board':[288,422],
  'Umrangsho Municipal Board':[215,455],
};

function procUpTo(ulb, mi) {
  return (ulb.monthly || []).slice(0, mi + 1).reduce((s, m) => s + (m.vol_processed || 0), 0);
}

function getULBsForMonth(rawULBs, mi) {
  return rawULBs.map(u => {
    const p = procUpTo(u, mi);
    const pct = u.vol_dpr > 0 ? Math.min(p / u.vol_dpr * 100, 100) : 0;
    const st = p >= u.vol_dpr && u.vol_dpr > 0 ? 'Completed' : p > 0 ? 'Ongoing' : 'Not Yet Started';
    return { ...u, p, pct, st };
  });
}

function clStats(ulbs) {
  return CL_ORDER.map(cn => {
    const cu = ulbs.filter(u => u.cluster === cn);
    const dpr = cu.reduce((s, u) => s + (u.vol_dpr || 0), 0);
    const pr = cu.reduce((s, u) => s + u.p, 0);
    return { n: cn, dpr, pr, pct: dpr > 0 ? pr / dpr * 100 : 0, cnt: cu.length };
  }).sort((a, b) => b.pct - a.pct);
}

function sn(n) {
  return n.replace(' Municipal Board','').replace(' (DMC)','').replace(' (TMB)','').replace(' (SMB)','').replace(' (BMB)','');
}

export default function App() {
  const [tab, setTab] = useState('ov');
  const [curM, setCurM] = useState(MONTHS.length - 1);
  const [selCl, setSelCl] = useState(null);
  const [tblFilter, setTblFilter] = useState('all');
  const [ulbTip, setUlbTip] = useState(null);
  const [clTip, setClTip] = useState(null);
  const mapRef = useRef(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const ulbs = useMemo(() => getULBsForMonth(lwmData.ulbs, curM), [curM]);
  const cds = useMemo(() => clStats(ulbs), [ulbs]);

  const totalP = useMemo(() => ulbs.reduce((s, u) => s + u.p, 0), [ulbs]);
  const totalD = useMemo(() => ulbs.reduce((s, u) => s + (u.vol_dpr || 0), 0), [ulbs]);
  const pct = totalD > 0 ? totalP / totalD * 100 : 0;
  const active = useMemo(() => ulbs.filter(u => u.p > 0).length, [ulbs]);
  const activeCl = useMemo(() => CL_ORDER.filter(cn => ulbs.filter(u => u.cluster === cn).some(u => u.p > 0)).length, [ulbs]);

  const getIdx = useCallback((e) => {
    if (!trackRef.current) return curM;
    const r = trackRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.round(Math.max(0, Math.min(1, (cx - r.left) / r.width)) * (MONTHS.length - 1));
  }, [curM]);

  useEffect(() => {
    const onMove = e => { if (dragging.current) setCurM(getIdx(e)); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [getIdx]);

  const slPct = (curM / (MONTHS.length - 1)) * 100;

  const displayULBs = useMemo(() => {
    let rows = selCl ? ulbs.filter(u => u.cluster === selCl) : ulbs;
    if (tblFilter !== 'all') rows = rows.filter(u => u.st === tblFilter);
    return [...rows].sort((a, b) => b.p - a.p);
  }, [ulbs, selCl, tblFilter]);

  const handleClClick = n => { setSelCl(prev => prev === n ? null : n); setUlbTip(null); setClTip(null); };
  const handleClHover = (n, e) => {
    if (!mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    const cu = ulbs.filter(u => u.cluster === n);
    const dpr = cu.reduce((s, u) => s + (u.vol_dpr || 0), 0);
    const pr = cu.reduce((s, u) => s + u.p, 0);
    const p = dpr > 0 ? pr / dpr * 100 : 0;
    setClTip({ n, dpr, pr, p, cnt: cu.length, x: Math.min(e.clientX - r.left + 12, r.width - 220), y: Math.max(e.clientY - r.top - 15, 4) });
    setUlbTip(null);
  };
  const handleULBHover = (u, e) => {
    if (!mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    setUlbTip({ u, x: Math.min(e.clientX - r.left + 10, r.width - 215), y: Math.max(e.clientY - r.top - 10, 4) });
    setClTip(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#06101e', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif', color: '#eef2ff' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        .kpi:hover { transform: translateY(-2px); }
        .cl-item:hover, .cl-item.sel { background: rgba(59,130,246,.06); }
        .tab { display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:50px;font-size:11.5px;font-weight:500;cursor:pointer;border:1px solid transparent;color:#4a6a8a;transition:all .15s;white-space:nowrap;background:none; }
        .tab.on { background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.35);color:#93c5fd; }
        .qbtn { padding:3px 9px;border-radius:5px;font-size:9.5px;font-weight:600;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:#4a6a8a;cursor:pointer;white-space:nowrap; }
        .qbtn.on { background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.35);color:#93c5fd; }
        .navbtn { width:24px;height:24px;border-radius:5px;font-size:14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:#4a6a8a;cursor:pointer;display:flex;align-items:center;justify-content:center; }
        table.dt { width:100%;border-collapse:collapse;table-layout:fixed; }
        table.dt th { font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:#2a4560;padding:7px 10px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.07);font-weight:600;text-align:left;white-space:nowrap; }
        table.dt td { padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.025);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        table.dt tr:hover td { background:rgba(255,255,255,.02); }
      `}</style>

      {/* HEADER */}
      <header style={{ background:'rgba(4,8,18,0.99)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'0 20px', height:46, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:200, flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'#1a56db', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".6"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".6"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".9"/></svg>
        </div>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#eef2ff', letterSpacing:'-.02em', lineHeight:1.1 }}>ASSAM LWM</div>
          <div style={{ fontSize:8, color:'#2a4560', letterSpacing:'.1em', textTransform:'uppercase' }}>Legacy Waste Management</div>
        </div>
        <div style={{ width:1, height:24, background:'rgba(255,255,255,.06)' }}/>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, fontSize:10, overflow:'hidden' }}>
          <span style={{ color:'#2a4560' }}>DMA, Govt of Assam</span>
          <span style={{ color:'#2a4560' }}>›</span>
          <span style={{ color:'#4a6a8a' }}>Mission Monitoring</span>
          <span style={{ color:'#2a4560' }}>›</span>
          <span style={{ color:'#60a5fa', fontWeight:600 }}>7 Clusters · 39 ULBs</span>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:8, color:'#2a4560' }}>Viewing</div>
          <div style={{ fontSize:11, color:'#60a5fa', fontWeight:600 }}>{MONTHS[curM]}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', background:'rgba(16,185,129,.09)', border:'1px solid rgba(16,185,129,.2)', borderRadius:20, fontSize:10, color:'#10b981', fontWeight:600 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 2s infinite' }}/>Live
        </div>
      </header>

      {/* MONTH SLICER */}
      <div style={{ background:'rgba(4,8,18,0.98)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'8px 20px', display:'flex', alignItems:'center', gap:14, position:'sticky', top:46, zIndex:190, flexShrink:0 }}>
        <div style={{ flexShrink:0 }}>
          <div style={{ fontSize:8, textTransform:'uppercase', letterSpacing:'.1em', color:'#2a4560', fontWeight:600 }}>Month Slicer</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#60a5fa', lineHeight:1.2 }}>{MONTHS[curM]}</div>
          <div style={{ fontSize:8, color:'#2a4560' }}>cumulative thru</div>
        </div>
        <div style={{ width:1, height:28, background:'rgba(255,255,255,.06)', flexShrink:0 }}/>
        <div style={{ flex:1, position:'relative', paddingTop:20, cursor:'pointer', userSelect:'none' }}>
          {/* Ticks */}
          <div style={{ position:'absolute', top:0, left:0, right:0, display:'flex' }}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setCurM(i)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', background:'none', border:'none', padding:0, cursor:'pointer' }}>
                <div style={{ width: i === curM ? 2 : 1, height: i === curM ? 9 : m.startsWith('Jan') || i === 0 ? 7 : 5, background: i === curM ? '#3b82f6' : i < curM ? 'rgba(59,130,246,.5)' : 'rgba(255,255,255,.08)', borderRadius:1 }}/>
                {(i === 0 || m.startsWith('Jan') || i === curM) && (
                  <span style={{ fontSize:7, color: i === curM ? '#60a5fa' : '#2a4560', marginTop:1, whiteSpace:'nowrap', fontWeight: i === curM ? 600 : 400 }}>{m}</span>
                )}
              </button>
            ))}
          </div>
          {/* Track */}
          <div ref={trackRef} style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.05)', position:'relative', marginTop:2, cursor:'pointer' }}
            onMouseDown={e => { dragging.current = true; setCurM(getIdx(e)); }}
            onTouchStart={e => { dragging.current = true; setCurM(getIdx(e)); }}>
            <motion.div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#1a56db,#3b82f6 60%,#0d9488)', originX:0 }} animate={{ width: `${slPct}%` }} transition={{ type:'spring', stiffness:300, damping:30 }}/>
            <motion.div animate={{ left: `calc(${slPct}% - 8px)` }} transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', width:16, height:16, borderRadius:'50%', background:'#3b82f6', border:'2.5px solid #06101e', cursor: dragging.current ? 'grabbing' : 'grab' }}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {[[0,'First'],[11,'Dec-25'],[MONTHS.length-1,'Latest']].map(([mi, label]) => (
            <button key={label} className={`qbtn${curM === mi ? ' on' : ''}`} onClick={() => setCurM(mi)}>{label}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:3, flexShrink:0 }}>
          <button className="navbtn" onClick={() => setCurM(m => Math.max(0, m - 1))}>‹</button>
          <button className="navbtn" onClick={() => setCurM(m => Math.min(MONTHS.length - 1, m + 1))}>›</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background:'rgba(4,8,18,0.96)', borderBottom:'1px solid rgba(255,255,255,.04)', padding:'0 20px', height:40, display:'flex', alignItems:'center', gap:2, position:'sticky', top:94, zIndex:180, flexShrink:0 }}>
        <button className={`tab${tab==='ov'?' on':''}`} onClick={() => setTab('ov')}>◈ Overview</button>
        <button className={`tab${tab==='ul'?' on':''}`} onClick={() => setTab('ul')}>≡ ULB Data</button>
        {selCl && (
          <div style={{ marginLeft:10, display:'flex', alignItems:'center', gap:6, fontSize:10, color:'#60a5fa' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:CL_COLORS[selCl]||'#888', display:'inline-block' }}/>
            {selCl} Cluster
            <button onClick={() => { setSelCl(null); setUlbTip(null); setClTip(null); }} style={{ fontSize:9, color:'#2a4560', background:'none', border:'none', cursor:'pointer', padding:'0 4px' }}>✕</button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <main style={{ flex:1, padding:'14px 20px 40px', display:'flex', flexDirection:'column', gap:12, maxWidth:1700, width:'100%', margin:'0 auto', boxSizing:'border-box' }}>
        <AnimatePresence mode="wait">
          {tab === 'ov' && (
            <motion.div key="ov" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* KPI STRIP — 6 cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:7 }}>
                {[
                  { label:'DPR Waste Target', sub:'Baseline', val:'809K MT', color:'#60a5fa', icon:'🗑' },
                  { label:'Waste Processed', sub:'Cumulative to date', val: totalP >= 1000 ? (totalP/1000).toFixed(2)+'K MT' : totalP.toFixed(0)+' MT', color:'#34d399', icon:'✓' },
                  { label:'Remaining', sub:'Pending processing', val: ((totalD-totalP)/1000).toFixed(0)+'K MT', color:'#f87171', icon:'⏱' },
                  { label:'Area Target', sub:'DPR Baseline (Sqm)', val:'158.6K', color:'#fb923c', icon:'◫' },
                  { label:'Area Reclaimed', sub:'Land restored', val:'0 Sqm', color:'#2dd4bf', icon:'◌' },
                  { label:'Active ULBs', sub:'Processing ongoing', val:`${active} / 39`, color:'#a78bfa', icon:'⬡' },
                ].map((k, i) => (
                  <motion.div key={k.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    className="kpi" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:11, padding:'11px 11px 9px', position:'relative', overflow:'hidden', transition:'transform .2s' }}>
                    <div style={{ position:'absolute', top:-8, right:-8, width:36, height:36, borderRadius:'50%', background:k.color, opacity:.12, filter:'blur(10px)' }}/>
                    <div style={{ width:26, height:26, borderRadius:7, background:k.color+'28', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:7, fontSize:12 }}>{k.icon}</div>
                    <div style={{ fontSize:17, fontWeight:700, lineHeight:1, marginBottom:3, letterSpacing:'-.03em', color:k.color }}>{k.val}</div>
                    <div style={{ fontSize:9.5, color:'#4a6a8a', lineHeight:1.3 }}>{k.label}</div>
                    <div style={{ fontSize:8, color:'#2a4560', marginTop:1 }}>{k.sub}</div>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:k.color, opacity:.4 }}/>
                  </motion.div>
                ))}
              </div>

              {/* MAP + CLUSTER PANEL */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 272px', gap:10 }}>
                {/* MAP */}
                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                    <div>
                      <div style={{ fontSize:8, textTransform:'uppercase', letterSpacing:'.1em', color:'#2a4560', fontWeight:600, marginBottom:1 }}>GIS Performance Map</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#eef2ff' }}>Assam — 7 Clusters · 39 ULBs</div>
                    </div>
                    <div style={{ fontSize:9, color:'#2a4560', textAlign:'right' }}>Hover cluster · click to filter<br/><span style={{ color:'#3b82f6' }}>Data: {MONTHS[curM]}</span></div>
                  </div>
                  <div style={{ flex:1, position:'relative', background:'#040c18', minHeight:0 }} ref={mapRef}
                    onMouseLeave={() => { setClTip(null); setUlbTip(null); }}>
                    <svg viewBox="0 0 860 500" style={{ width:'100%', height:'100%', display:'block' }} preserveAspectRatio="xMidYMid meet">
                      <defs><pattern id="mg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="rgba(59,130,246,0.04)" strokeWidth="0.5"/></pattern></defs>
                      <rect width="860" height="500" fill="#040c18"/><rect width="860" height="500" fill="url(#mg)"/>
                      <text x="430" y="17" fill="rgba(30,50,76,0.65)" fontSize="8" fontFamily="system-ui" letterSpacing="2" textAnchor="middle" fontWeight="600">ARUNACHAL PRADESH</text>
                      <text x="826" y="185" fill="rgba(30,50,76,0.55)" fontSize="7.5" fontFamily="system-ui" letterSpacing="1.5" textAnchor="middle" transform="rotate(90,826,185)">NAGALAND</text>
                      <text x="32" y="195" fill="rgba(30,50,76,0.55)" fontSize="7.5" fontFamily="system-ui" letterSpacing="1.5" textAnchor="middle" transform="rotate(-90,32,195)">BHUTAN</text>
                      <text x="36" y="370" fill="rgba(30,50,76,0.45)" fontSize="7" fontFamily="system-ui" textAnchor="middle" transform="rotate(-90,36,370)">MEGHALAYA</text>
                      <text x="255" y="490" fill="rgba(30,50,76,0.45)" fontSize="7.5" fontFamily="system-ui" textAnchor="middle">BANGLADESH</text>
                      <text x="620" y="490" fill="rgba(30,50,76,0.45)" fontSize="7.5" fontFamily="system-ui" textAnchor="middle">MANIPUR / MIZORAM</text>
                      <path d="M55,164 Q130,148 210,154 Q290,160 370,152 Q450,145 520,152 Q590,159 648,149 Q710,140 780,149 Q810,153 840,159" fill="none" stroke="rgba(96,165,250,0.18)" strokeWidth="8" strokeLinecap="round"/>
                      <text x="415" y="140" fill="rgba(96,165,250,0.28)" fontSize="7" fontStyle="italic" fontFamily="Georgia,serif">Brahmaputra River</text>

                      {[
                        {id:'bng', d:"M52,58 L138,40 L212,46 L246,70 L248,126 L232,175 L192,206 L152,213 L102,202 L65,183 L45,158 L40,118 L46,83 Z", lx:135, ly:125, lbl:'BONGAIGAON', c:'Bongaigaon'},
                        {id:'tzp', d:"M246,70 L308,48 L368,40 L428,48 L460,76 L465,128 L448,172 L410,198 L356,210 L293,208 L248,197 L232,175 L248,126 Z", lx:347, ly:125, lbl:'TEZPUR', c:'Tezpur'},
                        {id:'ngn', d:"M192,206 L232,175 L248,197 L293,208 L356,210 L410,198 L432,240 L430,305 L398,357 L342,375 L276,377 L216,365 L170,337 L150,293 L146,255 L168,230 Z", lx:288, ly:285, lbl:'NAGAON', c:'Nagaon'},
                        {id:'svs', d:"M460,76 L545,60 L615,70 L655,88 L675,130 L668,178 L645,215 L597,245 L542,258 L477,262 L432,248 L430,240 L432,208 L448,172 L465,128 Z", lx:545, ly:162, lbl:'SIVASAGAR', c:'Sivasagar'},
                        {id:'dbg', d:"M655,88 L728,76 L796,90 L840,126 L846,165 L830,205 L792,237 L745,249 L698,244 L652,232 L645,215 L668,178 L675,130 Z", lx:742, ly:159, lbl:'DIBRUGARH', c:'Dibrugarh'},
                        {id:'hfg', d:"M216,365 L276,377 L316,393 L320,445 L296,478 L250,487 L202,477 L172,450 L168,413 L182,387 Z", lx:246, ly:430, lbl:'HAFLONG', c:'Haflong'},
                        {id:'slc', d:"M342,375 L398,357 L442,368 L500,378 L552,402 L577,445 L560,485 L502,495 L430,497 L357,485 L316,460 L316,430 L316,410 L316,393 L276,377 Z", lx:430, ly:440, lbl:'SILCHAR', c:'Silchar'},
                      ].map(cl => {
                        const cd = cds.find(c => c.n === cl.c);
                        const col = CL_COLORS[cl.c];
                        const dim = selCl && selCl !== cl.c;
                        return (
                          <g key={cl.id} style={{ opacity: dim ? 0.18 : 1, transition:'opacity .2s' }}>
                            <path d={cl.d} fill={col+'24'} stroke={col+'88'} strokeWidth="1.2" style={{ cursor:'pointer', transition:'all .2s' }}
                              onMouseEnter={e => handleClHover(cl.c, e)}
                              onMouseLeave={() => setClTip(null)}
                              onClick={() => handleClClick(cl.c)}/>
                            <text x={cl.lx} y={cl.ly} fill={col} fontSize="9" fontFamily="system-ui" fontWeight="800" textAnchor="middle" pointerEvents="none" letterSpacing="0.5">{cl.lbl}</text>
                            <text x={cl.lx} y={cl.ly + 13} fill={col} fontSize="8" fontFamily="system-ui" fontWeight="600" textAnchor="middle" pointerEvents="none" opacity=".65">{cd ? cd.pct.toFixed(1)+'%' : '0%'}</text>
                          </g>
                        );
                      })}

                      {/* ULB markers */}
                      {ulbs.map(u => {
                        const pos = ULB_POS[u.n]; if (!pos) return null;
                        const [cx, cy] = pos;
                        const col = CL_COLORS[u.cluster] || '#888';
                        const ring = u.st === 'Completed' ? '#10b981' : u.p > 0 ? '#f59e0b' : '#ef4444';
                        const r = u.vol_dpr > 100000 ? 7 : u.vol_dpr > 10000 ? 5.5 : u.vol_dpr > 2000 ? 4.5 : 3.5;
                        const dim = selCl && selCl !== u.cluster;
                        return (
                          <g key={u.n} style={{ opacity: dim ? 0.1 : 1, transition:'opacity .2s', cursor:'pointer' }}
                            onMouseEnter={e => handleULBHover(u, e)}
                            onMouseLeave={() => setUlbTip(null)}>
                            <circle cx={cx} cy={cy} r={r+2.5} fill="none" stroke={ring} strokeWidth="1.5" opacity=".65"/>
                            <circle cx={cx} cy={cy} r={r} fill={col} opacity=".9"/>
                          </g>
                        );
                      })}

                      {/* Compass */}
                      <g transform="translate(828,28)">
                        <circle cx="0" cy="0" r="14" fill="rgba(4,8,18,.85)" stroke="rgba(59,130,246,.18)" strokeWidth="0.5"/>
                        <text x="0" y="-4" textAnchor="middle" fill="#3b82f6" fontSize="8" fontFamily="system-ui" fontWeight="700">N</text>
                        <line x1="0" y1="-2" x2="0" y2="7" stroke="rgba(255,255,255,.18)" strokeWidth="0.5"/>
                        <polygon points="0,-2 -2,3 0,2 2,3" fill="#3b82f6" opacity=".7"/>
                      </g>
                      {/* Legend */}
                      <g transform="translate(22,344)">
                        <rect x="-3" y="-3" width="88" height="78" rx="5" fill="rgba(4,8,18,.88)" stroke="rgba(255,255,255,.05)" strokeWidth="0.5"/>
                        <text x="2" y="7" fill="rgba(28,50,75,.85)" fontSize="6.5" fontFamily="system-ui" letterSpacing="1" fontWeight="600">STATUS</text>
                        <circle cx="8" cy="20" r="3.5" fill="#10b981" opacity=".9"/><text x="16" y="23.5" fill="#3a5878" fontSize="7.5" fontFamily="system-ui">Completed</text>
                        <circle cx="8" cy="34" r="3.5" fill="#f59e0b" opacity=".9"/><text x="16" y="37.5" fill="#3a5878" fontSize="7.5" fontFamily="system-ui">Ongoing</text>
                        <circle cx="8" cy="48" r="3.5" fill="#ef4444" opacity=".9"/><text x="16" y="51.5" fill="#3a5878" fontSize="7.5" fontFamily="system-ui">Not Started</text>
                        <text x="2" y="66" fill="rgba(28,50,75,.7)" fontSize="6.5" fontFamily="system-ui">● size = DPR vol</text>
                      </g>
                    </svg>

                    {/* Cluster tooltip */}
                    {clTip && (
                      <div style={{ position:'absolute', left:clTip.x, top:clTip.y, background:'rgba(4,8,18,0.97)', border:`1px solid ${CL_COLORS[clTip.n]}44`, borderRadius:10, padding:'11px 13px', minWidth:200, zIndex:99, pointerEvents:'none', fontSize:10.5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}><div style={{ width:9, height:9, borderRadius:'50%', background:CL_COLORS[clTip.n] }}/><span style={{ fontSize:12, fontWeight:700, color:CL_COLORS[clTip.n] }}>{clTip.n} Cluster</span></div>
                        <div style={{ fontSize:8.5, color:'#2a4560', marginBottom:8, paddingBottom:7, borderBottom:'1px solid rgba(255,255,255,.05)' }}>{clTip.cnt} ULBs · {MONTHS[curM]}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px', marginBottom:8 }}>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>DPR Target</div><div style={{ fontSize:12, fontWeight:600, color:'#60a5fa' }}>{(clTip.dpr/1000).toFixed(1)}K MT</div></div>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>Processed</div><div style={{ fontSize:12, fontWeight:600, color:'#34d399' }}>{clTip.pr.toFixed(0)} MT</div></div>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}><span style={{ fontSize:8, color:'#2a4560' }}>Completion</span><span style={{ fontSize:12, fontWeight:700, color: clTip.p>=80?'#10b981':clTip.p>0?'#f59e0b':'#ef4444' }}>{clTip.p.toFixed(1)}%</span></div>
                        <div style={{ height:4, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden', marginBottom:6 }}><div style={{ width:`${Math.min(clTip.p,100)}%`, height:'100%', background: clTip.p>=80?'#10b981':clTip.p>0?'#f59e0b':'#ef4444', borderRadius:2 }}/></div>
                        <div style={{ fontSize:8, color:'#2a4560' }}>Click to drill down ↗</div>
                      </div>
                    )}

                    {/* ULB tooltip */}
                    {ulbTip && (
                      <div style={{ position:'absolute', left:ulbTip.x, top:ulbTip.y, background:'rgba(4,8,18,0.97)', border:'1px solid rgba(59,130,246,.3)', borderRadius:10, padding:'11px 13px', minWidth:200, zIndex:99, pointerEvents:'none', fontSize:10.5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}><div style={{ width:8, height:8, borderRadius:'50%', background:CL_COLORS[ulbTip.u.cluster]||'#888', flexShrink:0 }}/><span style={{ fontSize:11.5, fontWeight:700, color:'#eef2ff' }}>{ulbTip.u.n}</span></div>
                        <div style={{ fontSize:8.5, color:'#2a4560', marginBottom:8, paddingBottom:7, borderBottom:'1px solid rgba(255,255,255,.05)' }}>{ulbTip.u.cluster} Cluster</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px', marginBottom:8 }}>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>DPR Waste</div><div style={{ fontSize:12, fontWeight:600, color:'#60a5fa' }}>{(ulbTip.u.vol_dpr||0).toLocaleString('en-IN')} MT</div></div>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>Processed</div><div style={{ fontSize:12, fontWeight:600, color:'#34d399' }}>{ulbTip.u.p.toFixed(1)} MT</div></div>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>Remaining</div><div style={{ fontSize:12, fontWeight:600, color:'#f87171' }}>{Math.max((ulbTip.u.vol_dpr||0)-ulbTip.u.p,0).toFixed(0)} MT</div></div>
                          <div><div style={{ fontSize:8, color:'#2a4560' }}>Completion</div><div style={{ fontSize:12, fontWeight:600, color: ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444' }}>{ulbTip.u.pct.toFixed(1)}%</div></div>
                        </div>
                        <div style={{ height:4, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden', marginBottom:6 }}><div style={{ width:`${Math.min(ulbTip.u.pct,100)}%`, height:'100%', background: ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444', borderRadius:2 }}/></div>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:600, background:(ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444')+'20', color: ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444', border:'1px solid '+(ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444')+'35' }}>
                          <span style={{ width:4, height:4, borderRadius:'50%', background: ulbTip.u.st==='Completed'?'#10b981':ulbTip.u.p>0?'#f59e0b':'#ef4444', display:'inline-block' }}/>{ulbTip.u.st}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CLUSTER SCORECARD */}
                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                    <div><div style={{ fontSize:8, textTransform:'uppercase', letterSpacing:'.1em', color:'#2a4560', fontWeight:600, marginBottom:1 }}>Cluster Ranking</div><div style={{ fontSize:14, fontWeight:700, color:'#eef2ff' }}>Scorecard</div></div>
                    <span style={{ fontSize:8.5, color:'#2a4560' }}>click to filter</span>
                  </div>
                  <div style={{ flex:1, overflowY:'auto' }}>
                    {cds.map((c, i) => {
                      const col = CL_COLORS[c.n] || '#888';
                      const sc = c.pct >= 80 ? '#10b981' : c.pct > 0 ? '#f59e0b' : '#ef4444';
                      const st = c.pct >= 100 ? 'Completed' : c.pct > 0 ? 'Ongoing' : 'Not Started';
                      const circ = 2 * Math.PI * 17;
                      return (
                        <div key={c.n} className={`cl-item${selCl===c.n?' sel':''}`} onClick={() => handleClClick(c.n)} style={{ padding:'9px 11px', borderBottom:'1px solid rgba(255,255,255,.03)', display:'flex', alignItems:'center', gap:9, cursor:'pointer', transition:'background .15s' }}>
                          <div style={{ fontSize:9.5, fontWeight:700, color:'#2a4560', minWidth:16, textAlign:'center' }}>#{i+1}</div>
                          <svg width="42" height="42" viewBox="0 0 42 42" style={{ flexShrink:0 }}>
                            <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5"/>
                            <circle cx="21" cy="21" r="17" fill="none" stroke={col} strokeWidth="3.5" strokeDasharray={circ.toFixed(1)} strokeDashoffset={(circ*(1-Math.min(c.pct,100)/100)).toFixed(1)} strokeLinecap="round" transform="rotate(-90 21 21)"/>
                            <text x="21" y="25" textAnchor="middle" fill={col} fontSize="9" fontFamily="system-ui" fontWeight="700" transform="rotate(90 21 21)">{c.pct.toFixed(0)}%</text>
                          </svg>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                              <div style={{ width:7, height:7, borderRadius:'50%', background:col, flexShrink:0 }}/>
                              <span style={{ fontSize:11.5, fontWeight:700, color:'#eef2ff' }}>{c.n}</span>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 7px', borderRadius:20, fontSize:8, fontWeight:600, background:sc+'20', color:sc, border:`1px solid ${sc}40`, marginLeft:'auto' }}>
                                <span style={{ width:4, height:4, borderRadius:'50%', background:sc, display:'inline-block' }}/>{st}
                              </span>
                            </div>
                            <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:8.5, color:'#2a4560' }}>DPR:<span style={{ color:'#4a6a8a', fontWeight:500 }}> {(c.dpr/1000).toFixed(0)}K</span></span>
                              <span style={{ fontSize:8.5, color:'#2a4560' }}>Done:<span style={{ color:'#34d399', fontWeight:500 }}> {c.pr.toFixed(0)}</span></span>
                              <span style={{ fontSize:8.5, color:'#2a4560' }}>ULBs:<span style={{ color:'#4a6a8a', fontWeight:500 }}> {c.cnt}</span></span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <span style={{ fontSize:7.5, color:'#2a4560', width:36 }}>Waste</span>
                              <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}><div style={{ width:`${Math.min(c.pct,100).toFixed(2)}%`, height:'100%', background:col, borderRadius:2 }}/></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* OVERALL PROGRESS BAR */}
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'14px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  <div>
                    <div style={{ fontSize:8.5, textTransform:'uppercase', letterSpacing:'.09em', color:'#2a4560', fontWeight:600 }}>Assam Mission — Overall Progress</div>
                    <div style={{ fontSize:11, color:'#4a6a8a', marginTop:2 }}>Total waste processed vs. DPR baseline across all 39 ULBs</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:'#3b82f6', lineHeight:1 }}>{pct.toFixed(3)}%</div>
                    <div style={{ fontSize:8.5, color:'#2a4560' }}>of 809K MT target</div>
                  </div>
                </div>
                <div style={{ height:10, background:'rgba(255,255,255,.05)', borderRadius:5, overflow:'hidden', margin:'8px 0 6px' }}>
                  <motion.div style={{ height:'100%', borderRadius:5, background:'linear-gradient(90deg,#1a56db,#3b82f6 55%,#0d9488)' }} animate={{ width:`${Math.max(0.2,pct).toFixed(4)}%` }} transition={{ duration:0.8 }}/>
                </div>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  {[
                    ['Processed', totalP>=1000?(totalP/1000).toFixed(2)+'K MT':totalP.toFixed(1)+' MT', '#34d399'],
                    ['Remaining', (totalD-totalP).toLocaleString('en-IN')+' MT', '#f87171'],
                    ['Active ULBs', `${active} of 39`, '#a78bfa'],
                    ['Clusters active', `${activeCl} of 7`, '#fbbf24'],
                  ].map(([l,v,c]) => (
                    <div key={l}><span style={{ fontSize:11, color:'#2a4560' }}>{l}: </span><span style={{ fontSize:12, fontWeight:600, color:c }}>{v}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'ul' && (
            <motion.div key="ul" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ fontSize:8.5, textTransform:'uppercase', letterSpacing:'.09em', color:'#2a4560', fontWeight:600, marginBottom:2 }}>All 39 Urban Local Bodies</div>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#eef2ff', letterSpacing:'-.02em', marginBottom:12 }}>ULB Performance Data</h2>
              <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'5px 10px', fontSize:10, color:'#2a4560', flex:1, maxWidth:220 }}>🔍 Search…</div>
                  {[['all','All'],['Ongoing','Ongoing'],['Completed','Completed'],['Not Yet Started','Not Started']].map(([f,l]) => (
                    <button key={f} className={`qbtn${tblFilter===f?' on':''}`} onClick={() => setTblFilter(f)}>{l}</button>
                  ))}
                  <span style={{ marginLeft:'auto', fontSize:9.5, color:'#2a4560' }}>{displayULBs.length} ULBs</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table className="dt" style={{ minWidth:680 }}>
                    <thead><tr>
                      <th style={{ width:'16%' }}>Cluster</th><th style={{ width:'24%' }}>ULB Name</th>
                      <th style={{ width:'11%' }}>DPR (MT)</th><th style={{ width:'11%' }}>Processed</th>
                      <th style={{ width:'11%' }}>Remaining</th><th style={{ width:'15%' }}>% Complete</th>
                      <th style={{ width:'12%' }}>Status</th>
                    </tr></thead>
                    <tbody>
                      {displayULBs.map(u => {
                        const col = CL_COLORS[u.cluster] || '#888';
                        const sc = u.st==='Completed'?'#10b981':u.p>0?'#f59e0b':'#ef4444';
                        const rem = Math.max((u.vol_dpr||0)-u.p,0);
                        return (
                          <tr key={u.n}>
                            <td><span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ width:6, height:6, borderRadius:'50%', background:col, display:'inline-block', flexShrink:0 }}/><span style={{ color:col, fontSize:9.5 }}>{u.cluster}</span></span></td>
                            <td style={{ color:'#eef2ff', fontWeight:500 }}>{sn(u.n)}</td>
                            <td style={{ color:'#4a6a8a', fontFamily:'monospace' }}>{(u.vol_dpr||0).toLocaleString('en-IN')}</td>
                            <td style={{ color:u.p>0?'#34d399':'#4a6a8a', fontFamily:'monospace' }}>{u.p.toFixed(1)}</td>
                            <td style={{ color:rem>0?'#f87171':'#4a6a8a', fontFamily:'monospace' }}>{rem.toFixed(0)}</td>
                            <td><div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:52, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden', flexShrink:0 }}><div style={{ width:`${Math.min(u.pct,100)}%`, height:'100%', background:sc, borderRadius:2 }}/></div><span style={{ fontSize:10, fontWeight:700, color:sc }}>{u.pct.toFixed(1)}%</span></div></td>
                            <td><span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:20, fontSize:8.5, fontWeight:600, background:sc+'20', color:sc, border:`1px solid ${sc}35` }}><span style={{ width:4, height:4, borderRadius:'50%', background:sc, display:'inline-block' }}/>{u.st==='Not Yet Started'?'Not Started':u.st}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.04)', padding:'10px 20px', textAlign:'center', fontSize:10, color:'#1e3550', background:'rgba(4,8,18,.7)' }}>
        Assam Legacy Waste Management · DMA, Government of Assam · Replace src/data/lwm_data.json to update all views
      </footer>
    </div>
  );
}
