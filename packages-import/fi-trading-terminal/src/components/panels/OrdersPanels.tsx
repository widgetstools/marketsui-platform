import { useState, useEffect, createContext, useContext } from 'react';
import { INITIAL_ORDERS } from '@/data/tradingData';

const BD = '1px solid var(--bn-border)';
type Order = typeof INITIAL_ORDERS[0];

const statusBadge=(s:string)=>{
  const m:Record<string,{bg:string,color:string,border:string}>={
    Filled:{bg:'rgba(45,212,191,0.1)',color:'var(--bn-green)',border:'rgba(45,212,191,0.3)'},
    Partial:{bg:'rgba(240,185,11,0.1)',color:'#f0b90b',border:'rgba(240,185,11,0.3)'},
    Pending:{bg:'rgba(30,144,255,0.1)',color:'#1e90ff',border:'rgba(30,144,255,0.3)'},
    Cancelled:{bg:'rgba(248,113,113,0.1)',color:'var(--bn-red)',border:'rgba(248,113,113,0.3)'},
  };
  const st=m[s]||m.Pending;
  return <span style={{fontSize:9,padding:'1px 6px',borderRadius:2,background:st.bg,color:st.color,border:`1px solid ${st.border}`,fontFamily:'JetBrains Mono,monospace'}}>{s}</span>;
};

interface OrdersCtx { orders: Order[]; selected: Order|null; setSelected: (o:Order|null)=>void; filter: string; setFilter: (f:string)=>void; }
const OrdersContext = createContext<OrdersCtx>({ orders:INITIAL_ORDERS, selected:null, setSelected:()=>{}, filter:'All', setFilter:()=>{} });

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders,setOrders]=useState<Order[]>(INITIAL_ORDERS);
  const [selected,setSelected]=useState<Order|null>(null);
  const [filter,setFilter]=useState('All');
  useEffect(()=>{
    const id=setInterval(()=>setOrders(prev=>prev.map(o=>o.status==='Partial'&&Math.random()<0.3?{...o,status:'Filled',filled:o.qty}:o)),5000);
    return()=>clearInterval(id);
  },[]);
  return <OrdersContext.Provider value={{orders,selected,setSelected,filter,setFilter}}>{children}</OrdersContext.Provider>;
}

export function OrderKpis() {
  const {orders}=useContext(OrdersContext);
  const filled = orders.filter(o=>o.status==='Filled').length;
  const pending = orders.filter(o=>o.status==='Pending'||o.status==='Partial').length;
  const cancelled = orders.filter(o=>o.status==='Cancelled').length;
  const total = orders.length;
  const fillRate = total > 0 ? Math.round((filled/total)*100) : 0;

  return (
    <div style={{display:'flex',alignItems:'stretch',height:'100%',overflow:'hidden',background:'var(--bn-bg1)',gap:1}}>
      {/* Left: big number + fill rate ring */}
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'8px 18px',flexShrink:0}}>
        <div style={{position:'relative',width:48,height:48}}>
          <svg viewBox="0 0 48 48" width={48} height={48}>
            <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bn-bg3)" strokeWidth="4"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bn-green)" strokeWidth="4"
              strokeDasharray={`${fillRate*1.257} 125.7`} strokeLinecap="round"
              transform="rotate(-90 24 24)" style={{transition:'stroke-dasharray 0.5s ease'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span className="font-mono-fi font-bold" style={{fontSize:13,color:'var(--bn-t0)'}}>{fillRate}%</span>
          </div>
        </div>
        <div>
          <div className="font-mono-fi font-bold" style={{fontSize:18,color:'var(--bn-t0)',lineHeight:1}}>{total}</div>
          <div style={{fontSize:9,color:'var(--bn-t2)',marginTop:2}}>ORDERS TODAY</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{width:1,background:'var(--bn-border)',alignSelf:'stretch',margin:'8px 0'}}/>

      {/* Status breakdown — horizontal bar + numbers */}
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'8px 18px',gap:6}}>
        {/* Stacked bar */}
        <div style={{display:'flex',height:6,borderRadius:3,overflow:'hidden',background:'var(--bn-bg3)'}}>
          {filled > 0 && <div style={{width:`${(filled/total)*100}%`,background:'var(--bn-green)',transition:'width 0.5s ease'}}/>}
          {pending > 0 && <div style={{width:`${(pending/total)*100}%`,background:'#f0b90b',transition:'width 0.5s ease'}}/>}
          {cancelled > 0 && <div style={{width:`${(cancelled/total)*100}%`,background:'var(--bn-red)',transition:'width 0.5s ease'}}/>}
        </div>
        {/* Legend row */}
        <div style={{display:'flex',gap:16}}>
          {[
            {label:'Filled',val:filled,color:'var(--bn-green)'},
            {label:'Pending',val:pending,color:'#f0b90b'},
            {label:'Cancelled',val:cancelled,color:'var(--bn-red)'},
          ].map(s=>(
            <div key={s.label} style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:s.color,flexShrink:0}}/>
              <span style={{fontSize:9,color:'var(--bn-t2)'}}>{s.label}</span>
              <span className="font-mono-fi font-semibold" style={{fontSize:11,color:'var(--bn-t0)'}}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{width:1,background:'var(--bn-border)',alignSelf:'stretch',margin:'8px 0'}}/>

      {/* Notional + buy/sell split */}
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'8px 18px',flexShrink:0}}>
        <div>
          <div style={{fontSize:9,color:'var(--bn-t2)',marginBottom:2}}>TOTAL NOTIONAL</div>
          <div className="font-mono-fi font-bold" style={{fontSize:18,color:'var(--bn-cyan)',lineHeight:1}}>$67MM</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:9,color:'var(--bn-t2)',width:24}}>BUY</span>
            <div style={{width:60,height:4,borderRadius:2,background:'var(--bn-bg3)',overflow:'hidden'}}>
              <div style={{width:'62%',height:'100%',background:'var(--bn-green)',borderRadius:2}}/>
            </div>
            <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-green)'}}>$42M</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:9,color:'var(--bn-t2)',width:24}}>SELL</span>
            <div style={{width:60,height:4,borderRadius:2,background:'var(--bn-bg3)',overflow:'hidden'}}>
              <div style={{width:'38%',height:'100%',background:'var(--bn-red)',borderRadius:2}}/>
            </div>
            <span className="font-mono-fi" style={{fontSize:9,color:'var(--bn-red)'}}>$25M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderBlotter() {
  const {orders,selected,setSelected,filter,setFilter}=useContext(OrdersContext);
  const FILTERS=['All','Filled','Partial','Pending','Cancelled'];
  const filtered=orders.filter(o=>filter==='All'||o.status===filter);
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      {/* Filter toolbar (no title — dock header has it) */}
      <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 10px',flexShrink:0}}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{fontSize:9,padding:'2px 8px',marginLeft:3,borderRadius:2,border:BD,background:filter===f?'var(--bn-border)':'transparent',color:filter===f?'var(--bn-t0)':'var(--bn-t1)',cursor:'pointer',fontFamily:'JetBrains Mono,monospace'}}>{f}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'var(--bn-bg2)',position:'sticky',top:0,zIndex:1}}>
            {['TIME','BOND','SIDE','TYPE','QTY','FILLED','PX','YTM','STATUS'].map(h=>(
              <th key={h} style={{fontSize:11,color:'var(--bn-t1)',padding:'5px 10px',borderBottom:BD,textAlign:h==='BOND'||h==='TIME'?'left':'right',fontWeight:400,letterSpacing:'0.04em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(o=>(
              <tr key={o.id} onClick={()=>setSelected(o)} style={{borderBottom:'1px solid rgba(43,49,57,0.5)',cursor:'pointer',background:selected?.id===o.id?'var(--bn-bg2)':'transparent'}}>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--bn-t2)'}}>{o.time}</td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#00bcd4'}}>{o.bond}</td>
                <td style={{padding:'5px 10px'}}><span style={{fontSize:9,fontWeight:700,color:o.side==='Buy'?'var(--bn-green)':'var(--bn-red)',fontFamily:'JetBrains Mono,monospace'}}>{o.side.toUpperCase()}</span></td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--bn-t1)',textAlign:'right'}}>{o.type}</td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--bn-t0)',textAlign:'right'}}>{o.qty}</td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:o.filled===o.qty?'var(--bn-green)':'#f0b90b',textAlign:'right'}}>{o.filled}</td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--bn-t0)',textAlign:'right'}}>{o.px>0?o.px.toFixed(3):'—'}</td>
                <td style={{padding:'5px 10px',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--bn-t1)',textAlign:'right'}}>{o.ytm>0?o.ytm.toFixed(2)+'%':'—'}</td>
                <td style={{padding:'5px 10px',textAlign:'right'}}>{statusBadge(o.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrderDetail() {
  const {selected}=useContext(OrdersContext);
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bn-bg1)',overflow:'hidden'}}>
      {selected?(
        <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:12,borderRadius:3,border:BD,background:'var(--bn-bg2)'}}>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:11,color:'#00bcd4',marginBottom:5}}>{selected.bond}</div>
            {statusBadge(selected.status)}
          </div>
          {[['Order Type',selected.type],['Side',selected.side],['Quantity',selected.qty],['Filled',selected.filled],['Price',selected.px>0?selected.px.toFixed(3):'—'],['YTM',selected.ytm>0?selected.ytm.toFixed(2)+'%':'—'],['Time',selected.time],['Settlement','T+2']].map(([l,v])=>(
            <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:6,borderBottom:'1px solid rgba(43,49,57,0.5)'}}>
              <span style={{fontSize:9,color:'var(--bn-t1)',fontFamily:'JetBrains Mono,monospace'}}>{l}</span>
              <span style={{fontSize:11,color:l==='Side'?(v==='Buy'?'var(--bn-green)':'var(--bn-red)'):'var(--bn-t0)',fontFamily:'JetBrains Mono,monospace'}}>{v}</span>
            </div>
          ))}
          {(selected.status==='Pending'||selected.status==='Partial')&&(
            <button style={{width:'100%',padding:'7px',borderRadius:3,border:'1px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.1)',color:'var(--bn-red)',fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:11,cursor:'pointer',marginTop:4}}>CANCEL ORDER</button>
          )}
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:11,color:'var(--bn-t3)',fontFamily:'JetBrains Mono,monospace'}}>Click a row to view detail</span>
        </div>
      )}
    </div>
  );
}
