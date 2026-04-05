import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { BONDS, OAS_DATA } from '@/data/tradingData';

const BD = '1px solid var(--bn-border)';
const TT=(props:any)=>{
  if(!props.active||!props.payload?.length)return null;
  return <div style={{background:'var(--bn-bg2)',border:BD,borderRadius:3,padding:'6px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11}}>
    <div style={{color:'var(--bn-t1)',marginBottom:3}}>{props.label}</div>
    {props.payload.map((p:any,i:number)=><div key={i} style={{color:p.color||'var(--bn-t0)'}}>{p.name}: {p.value}</div>)}
  </div>;
};

const SCATTER_DATA=BONDS.map(b=>({name:b.ticker,x:b.dur,y:b.oas,dv01:b.dv01,rtg:b.rtgClass}));
const RTG_COLOR:Record<string,string>={aaa:'#1e90ff',aa:'#00bcd4',a:'var(--bn-green)',bbb:'#f0b90b',hy:'var(--bn-red)'};
const DURATION_BUCKETS=[{label:'0-1Y',count:3,dv01:305,pct:6},{label:'1-3Y',count:4,dv01:1010,pct:19},{label:'3-5Y',count:5,dv01:2180,pct:41},{label:'5-7Y',count:3,dv01:1890,pct:36},{label:'7-10Y',count:2,dv01:2040,pct:38},{label:'10Y+',count:3,dv01:2995,pct:56}];
const HIST_OAS=Array.from({length:60},(_,i)=>{const d=new Date(2026,3,4);d.setDate(d.getDate()-59+i);return{date:`${d.getMonth()+1}/${d.getDate()}`,ig:+(52+Math.sin(i/8)*8+(Math.random()-.5)*3).toFixed(1),hy:+(340+Math.sin(i/6)*25+(Math.random()-.5)*8).toFixed(1)};});
const SECTOR_ALLOC=[{sector:'Government',pct:27.3,mv:14.8,bonds:6},{sector:'Technology',pct:22.1,mv:12.0,bonds:4},{sector:'Financials',pct:21.7,mv:11.8,bonds:5},{sector:'Healthcare',pct:10.3,mv:5.6,bonds:1},{sector:'Consumer',pct:9.8,mv:5.3,bonds:2},{sector:'Telecom',pct:8.8,mv:4.7,bonds:1}];
const SECTOR_COLORS=['#1e90ff','#00bcd4','#c084fc','var(--bn-green)','#f0b90b','#f59e0b'];

// ── 1. OAS vs Duration scatter (kept — good viz) ──
export function OasVsDuration() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{flex:1}}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{top:12,right:20,bottom:16,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bn-bg2)"/>
            <XAxis dataKey="x" name="Duration" type="number" tick={{fill:'var(--bn-t2)',fontSize:9,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} label={{value:'Duration (yrs)',fill:'var(--bn-t2)',fontSize:9,position:'insideBottom',offset:-4}}/>
            <YAxis dataKey="y" name="OAS" type="number" tick={{fill:'var(--bn-t2)',fontSize:9,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} tickFormatter={v=>`+${v}`}/>
            <Tooltip content={<TT/>} cursor={{strokeDasharray:'3 3',stroke:'var(--bn-border)'}}/>
            <Scatter data={SCATTER_DATA} shape={(props:any)=>{
              const{cx,cy,payload}=props;
              return<circle cx={cx} cy={cy} r={Math.min(5+payload.dv01/300,10)} fill={RTG_COLOR[payload.rtg]||'#888'} fillOpacity={0.75} stroke={RTG_COLOR[payload.rtg]} strokeWidth={1}/>;
            }}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:'flex',gap:10,padding:'4px 14px 8px',flexShrink:0}}>
        {Object.entries(RTG_COLOR).map(([r,c])=>(
          <div key={r} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:c}}/>
            <span style={{fontSize:9,color:'var(--bn-t2)',fontFamily:'JetBrains Mono,monospace'}}>{r.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2. Duration Buckets — heatmap-style grid instead of bar chart ──
// Enrich bucket data with per-bucket bonds from BONDS array
const BUCKET_RANGES: [number,number][] = [[0,1],[1,3],[3,5],[5,7],[7,10],[10,50]];
const BUCKET_DETAIL = DURATION_BUCKETS.map((d,i) => {
  const [lo,hi] = BUCKET_RANGES[i];
  const bonds = BONDS.filter(b => b.dur >= lo && b.dur < hi);
  const avgOas = bonds.length ? Math.round(bonds.reduce((a,b)=>a+b.oas,0)/bonds.length) : 0;
  const totalMv = bonds.reduce((a,b)=>a+parseFloat(b.face),0);
  return { ...d, avgOas, totalMv, bonds };
});
const totalDv01All = BUCKET_DETAIL.reduce((a,d)=>a+d.dv01,0);

export function DurationBuckets() {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{flex:1,overflow:'auto',padding:6}}>
        {/* Heatmap-style grid */}
        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:2}}>
          <thead>
            <tr>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'left',padding:'4px 8px',fontWeight:400}}>Bucket</th>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'right',padding:'4px 6px',fontWeight:400}}>Bonds</th>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'right',padding:'4px 6px',fontWeight:400}}>DV01</th>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'right',padding:'4px 6px',fontWeight:400}}>% Risk</th>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'right',padding:'4px 6px',fontWeight:400}}>Avg OAS</th>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'left',padding:'4px 6px',fontWeight:400}}>Distribution</th>
            </tr>
          </thead>
          <tbody>
            {BUCKET_DETAIL.map((d) => {
              const riskPct = totalDv01All > 0 ? (d.dv01/totalDv01All)*100 : 0;
              const barColor = d.avgOas > 80 ? '#f0b90b' : d.avgOas > 30 ? '#00bcd4' : '#1e90ff';
              return (
                <tr key={d.label}>
                  <td style={{padding:'6px 8px',borderRadius:3,background:'var(--bn-bg2)'}}>
                    <span className="font-mono-fi font-semibold" style={{fontSize:11,color:'var(--bn-t0)'}}>{d.label}</span>
                  </td>
                  <td style={{padding:'6px 6px',borderRadius:3,background:heatBg(d.count,5,'#c084fc'),textAlign:'right'}}>
                    <span className="font-mono-fi font-semibold" style={{fontSize:11,color:'var(--bn-t0)'}}>{d.count}</span>
                  </td>
                  <td style={{padding:'6px 6px',borderRadius:3,background:heatBg(d.dv01,3000,'#1e90ff'),textAlign:'right'}}>
                    <span className="font-mono-fi font-semibold" style={{fontSize:9,color:'var(--bn-t0)'}}>${(d.dv01/1000).toFixed(1)}K</span>
                  </td>
                  <td style={{padding:'6px 6px',borderRadius:3,background:heatBg(riskPct,35,'#1e90ff'),textAlign:'right'}}>
                    <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-t0)'}}>{riskPct.toFixed(0)}%</span>
                  </td>
                  <td style={{padding:'6px 6px',borderRadius:3,background:heatBg(d.avgOas,150,'#f0b90b'),textAlign:'right'}}>
                    <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-t0)'}}>{d.avgOas > 0 ? `+${d.avgOas}bp` : '—'}</span>
                  </td>
                  <td style={{padding:'6px 6px',borderRadius:3}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <div style={{flex:1,height:6,borderRadius:3,background:'var(--bn-bg3)',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${riskPct*2.8}%`,background:barColor,borderRadius:3,opacity:0.7}}/>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Summary footer */}
      <div style={{display:'flex',gap:14,padding:'6px 14px',borderTop:BD,flexShrink:0}}>
        {[
          {l:'Total DV01',v:`$${(totalDv01All/1000).toFixed(1)}K`,c:'#1e90ff'},
          {l:'Avg Dur',v:'4.82yr',c:'#00bcd4'},
          {l:'Bonds',v:String(BUCKET_DETAIL.reduce((a,d)=>a+d.count,0)),c:'var(--bn-t0)'},
          {l:'Wt Avg OAS',v:`+${Math.round(BUCKET_DETAIL.reduce((a,d)=>a+d.avgOas*d.count,0)/BUCKET_DETAIL.reduce((a,d)=>a+d.count,0))}bp`,c:'#f0b90b'},
        ].map(s=>(
          <div key={s.l} style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{fontSize:9,color:'var(--bn-t2)'}}>{s.l}</span>
            <span className="font-mono-fi font-semibold" style={{fontSize:11,color:s.c}}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. Sector Allocation — heatmap grid ──
// Rows = sectors, Cols = metrics. Cell background intensity = relative value within that column.
const SECTOR_HEATMAP = SECTOR_ALLOC.map(s => {
  const bond = BONDS.filter(b => b.sector === s.sector);
  const avgOas = bond.length ? Math.round(bond.reduce((a,b)=>a+b.oas,0)/bond.length) : 0;
  const totalDv01 = bond.reduce((a,b)=>a+b.dv01,0);
  const avgDur = bond.length ? +(bond.reduce((a,b)=>a+b.dur,0)/bond.length).toFixed(1) : 0;
  return { ...s, avgOas, totalDv01, avgDur };
});
const HEAT_COLS: {key:string; label:string; fmt:(v:number)=>string; color:string}[] = [
  { key:'pct',      label:'Weight',  fmt:v=>`${v}%`,              color:'#1e90ff' },
  { key:'mv',       label:'MV ($M)', fmt:v=>`$${v}`,              color:'#00bcd4' },
  { key:'bonds',    label:'Bonds',   fmt:v=>String(v),            color:'#c084fc' },
  { key:'totalDv01',label:'DV01',    fmt:v=>`$${(v/1000).toFixed(1)}K`, color:'#1e90ff' },
  { key:'avgOas',   label:'Avg OAS', fmt:v=>`+${v}bp`,           color:'#f0b90b' },
  { key:'avgDur',   label:'Avg Dur', fmt:v=>`${v}yr`,            color:'#00bcd4' },
];

function heatBg(value: number, max: number, color: string): string {
  const intensity = max > 0 ? Math.max(0.06, (value / max) * 0.35) : 0.06;
  // Parse hex color to rgba
  const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
  return `rgba(${r},${g},${b},${intensity})`;
}

export function SectorAllocation() {
  // Pre-compute max per column for intensity scaling
  const colMaxes: Record<string,number> = {};
  HEAT_COLS.forEach(c => {
    colMaxes[c.key] = Math.max(...SECTOR_HEATMAP.map(s => (s as any)[c.key] as number));
  });

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{flex:1,overflow:'auto',padding:6}}>
        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:2}}>
          <thead>
            <tr>
              <th style={{fontSize:9,color:'var(--bn-t2)',textAlign:'left',padding:'4px 8px',fontWeight:400}}>Sector</th>
              {HEAT_COLS.map(c=>(
                <th key={c.key} style={{fontSize:9,color:'var(--bn-t2)',textAlign:'right',padding:'4px 6px',fontWeight:400,whiteSpace:'nowrap'}}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTOR_HEATMAP.map((s,i)=>(
              <tr key={s.sector}>
                <td style={{padding:'5px 8px',borderRadius:3}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:3,height:16,borderRadius:2,background:SECTOR_COLORS[i],flexShrink:0}}/>
                    <span style={{fontSize:9,color:'var(--bn-t0)',whiteSpace:'nowrap'}}>{s.sector}</span>
                  </div>
                </td>
                {HEAT_COLS.map(c=>{
                  const val = (s as any)[c.key] as number;
                  const bg = heatBg(val, colMaxes[c.key], c.color);
                  return (
                    <td key={c.key} style={{padding:'5px 6px',borderRadius:3,background:bg,textAlign:'right'}}>
                      <span className="font-mono-fi font-semibold" style={{fontSize:9,color:'var(--bn-t0)'}}>{c.fmt(val)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 4. Historical OAS — area chart with gradient (kept, improved) ──
export function HistoricalOas() {
  const [period,setPeriod]=useState('3M');
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 10px',flexShrink:0}}>
        {['1M','3M','6M','1Y'].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{fontSize:9,padding:'2px 6px',marginLeft:3,borderRadius:2,border:BD,background:period===p?'var(--bn-border)':'transparent',color:period===p?'var(--bn-t0)':'var(--bn-t1)',cursor:'pointer',fontFamily:'JetBrains Mono,monospace'}}>{p}</button>
        ))}
      </div>
      <div style={{flex:1}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={HIST_OAS} margin={{top:4,right:16,bottom:8,left:8}}>
            <defs>
              <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e90ff" stopOpacity={0.15}/><stop offset="95%" stopColor="#1e90ff" stopOpacity={0}/></linearGradient>
              <linearGradient id="hyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--bn-red)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--bn-red)" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bn-bg2)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'var(--bn-t2)',fontSize:8,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} interval={14}/>
            <YAxis yAxisId="ig" tick={{fill:'var(--bn-t2)',fontSize:8,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} domain={['auto','auto']} width={32}/>
            <YAxis yAxisId="hy" orientation="right" tick={{fill:'var(--bn-t2)',fontSize:8,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} domain={['auto','auto']} width={38}/>
            <Tooltip content={<TT/>}/>
            <Area yAxisId="ig" type="monotone" dataKey="ig" name="CDX IG" stroke="#1e90ff" strokeWidth={1.5} fill="url(#igGrad)" dot={false}/>
            <Area yAxisId="hy" type="monotone" dataKey="hy" name="CDX HY" stroke="var(--bn-red)" strokeWidth={1.5} fill="url(#hyGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── 5. OAS Distribution — lollipop chart with inline values instead of horizontal bars ──
export function OasDistribution() {
  const maxOas = Math.max(...OAS_DATA.map(d=>d.oas));
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:'8px 10px',display:'flex',flexDirection:'column',justifyContent:'center',gap:2}}>
        {OAS_DATA.map((d,i)=>{
          const pct = maxOas > 0 ? (d.oas/maxOas)*100 : 0;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0'}}>
              <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-t1)',width:72,textAlign:'right',flexShrink:0}}>{d.name}</span>
              <div style={{flex:1,position:'relative',height:14}}>
                {/* Track */}
                <div style={{position:'absolute',top:6,left:0,right:0,height:2,background:'var(--bn-bg3)',borderRadius:1}}/>
                {/* Filled */}
                <div style={{position:'absolute',top:6,left:0,width:`${pct}%`,height:2,background:d.color,borderRadius:1,transition:'width 0.3s ease'}}/>
                {/* Dot */}
                <div style={{position:'absolute',top:3,left:`${pct}%`,width:8,height:8,borderRadius:'50%',background:d.color,border:'2px solid var(--bn-bg1)',transform:'translateX(-4px)',transition:'left 0.3s ease'}}/>
              </div>
              <span className="font-mono-fi font-semibold" style={{fontSize:9,color:d.color,width:40,textAlign:'right',flexShrink:0}}>+{d.oas}bp</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 6. P&L Attribution — waterfall with running total line ──
const PNL_DATA = [
  {attr:'Carry',pnl:+188,cum:188},
  {attr:'Spread',pnl:+142,cum:330},
  {attr:'Rates',pnl:+88,cum:418},
  {attr:'FX',pnl:-22,cum:396},
  {attr:'Costs',pnl:-34,cum:362},
];

export function PnlAttribution() {
  const maxAbs = Math.max(...PNL_DATA.map(d=>Math.abs(d.pnl)));
  const maxCum = Math.max(...PNL_DATA.map(d=>d.cum));
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'12px 14px',gap:4}}>
        {/* Waterfall items */}
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:6}}>
          {PNL_DATA.map((d,i)=>{
            const barPct = (Math.abs(d.pnl)/maxAbs)*50;
            const isPos = d.pnl >= 0;
            const color = isPos ? '#1e90ff' : 'var(--bn-red)';
            return (
              <div key={d.attr} style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:9,color:'var(--bn-t1)',width:42,textAlign:'right',flexShrink:0}}>{d.attr}</span>
                {/* Bar centered on a midpoint */}
                <div style={{flex:1,position:'relative',height:18}}>
                  <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:1,background:'var(--bn-bg3)'}}/>
                  <div style={{
                    position:'absolute', top:2, height:14, borderRadius:3,
                    background:color, opacity:0.7,
                    ...(isPos ? {left:'50%',width:`${barPct}%`} : {right:'50%',width:`${barPct}%`}),
                    transition:'width 0.3s ease',
                  }}/>
                </div>
                <span className="font-mono-fi font-semibold" style={{fontSize:11,color,width:48,textAlign:'right',flexShrink:0}}>
                  {isPos?'+':''}${d.pnl}K
                </span>
                {/* Running total */}
                <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-t2)',width:40,textAlign:'right',flexShrink:0}}>
                  Σ{d.cum}
                </span>
              </div>
            );
          })}
        </div>
        {/* Total */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderTop:BD}}>
          <span style={{fontSize:9,color:'var(--bn-t1)'}}>NET P&L MTD</span>
          <span className="font-mono-fi font-bold" style={{fontSize:18,color:'#1e90ff'}}>+$362K</span>
        </div>
      </div>
    </div>
  );
}
