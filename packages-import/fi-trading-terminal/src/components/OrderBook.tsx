import { useState, useEffect, useMemo } from 'react';
import type { Bond } from '@/data/tradingData';

interface Level { price:number; qty:number; total:number; pct:number; }

function genLevels(mid:number, side:'ask'|'bid', n=14): Level[] {
  const levels:Level[] = [];
  let cumQty = 0;
  for (let i=0; i<n; i++) {
    const offset = side==='ask' ? (i+0.5)*0.025 : -(i+0.5)*0.025;
    const price = +(mid + offset).toFixed(3);
    const qty = +(Math.random()*0.5+0.001).toFixed(5);
    cumQty += qty;
    levels.push({ price, qty, total: +cumQty.toFixed(5), pct: 0 });
  }
  const maxTotal = levels[levels.length-1].total;
  return levels.map(l => ({ ...l, pct: (l.total/maxTotal)*100 }));
}

interface OrderBookProps { bond: Bond; onClickPrice?: (p:number)=>void; }

export function OrderBook({ bond, onClickPrice }: OrderBookProps) {
  const mid = (bond.bid + bond.ask) / 2;
  const [asks, setAsks] = useState<Level[]>(() => genLevels(mid,'ask',14).reverse());
  const [bids, setBids] = useState<Level[]>(() => genLevels(mid,'bid',14));
  const [precision, setPrecision] = useState('0.01');
  const [view, setView] = useState<'both'|'asks'|'bids'>('both');
  const [trades, setTrades] = useState<{price:number;qty:number;side:'B'|'S';time:string}[]>([]);

  // Simulate live order book updates
  useEffect(() => {
    const id = setInterval(() => {
      const newMid = mid + (Math.random()-0.5)*0.04;
      setAsks(genLevels(newMid,'ask',14).reverse());
      setBids(genLevels(newMid,'bid',14));
      // Append a trade
      const side = Math.random()>0.5?'B':'S' as 'B'|'S';
      const price = +(newMid + (side==='B'?0.012:-0.012)).toFixed(3);
      const qty = +(Math.random()*0.3+0.001).toFixed(5);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setTrades(prev => [{price,qty,side,time},...prev.slice(0,24)]);
    }, 1000);
    return () => clearInterval(id);
  }, [mid]);

  const spread = asks.length && bids.length ? +(asks[asks.length-1].price - bids[0].price).toFixed(3) : 0;
  const spreadPct = +(spread/mid*100).toFixed(4);

  return (
    <div className="flex flex-col h-full" style={{background:'var(--bn-bg1)'}}>
      {/* Toolbar (no title — dock header has it) */}
      <div className="flex items-center justify-end px-3 py-1.5 border-b flex-shrink-0" style={{borderColor:'var(--bn-border)'}}>
        <div className="flex items-center gap-1">
          {/* view toggles */}
          {[
            {v:'both', icon:'▬▬'},
            {v:'bids', icon:'▬'},
            {v:'asks', icon:'▬'},
          ].map(opt => (
            <button key={opt.v} onClick={() => setView(opt.v as any)}
              className="w-6 h-5 rounded text-xs"
              style={{background:view===opt.v?'var(--bn-bg3)':'transparent',color:opt.v==='asks'?'var(--bn-red)':opt.v==='bids'?'var(--bn-green)':'var(--bn-t1)'}}>
              {opt.icon}
            </button>
          ))}
          <select value={precision} onChange={e=>setPrecision(e.target.value)}
            className="font-mono-fi text-xs rounded px-1 py-0.5 border"
            style={{background:'var(--bn-bg2)',borderColor:'var(--bn-border2)',color:'var(--bn-t1)'}}>
            {['0.001','0.01','0.1'].map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-right flex-shrink-0" style={{background:'var(--bn-bg2)'}}>
        {['Price (USD)','Amount (MM)','Total'].map(h => (
          <div key={h} className="text-xs" style={{color:'var(--bn-t1)',textAlign:h==='Price (USD)'?'left':'right'}}>{h}</div>
        ))}
      </div>

      {/* Order book levels */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (sell side) */}
        {(view==='both'||view==='asks') && (
          <div className="flex flex-col-reverse overflow-y-auto" style={{flex:view==='asks'?1:'0 0 auto',maxHeight:view==='asks'?'100%':undefined}}>
            {asks.map((a,i) => (
              <div key={i} onClick={() => onClickPrice?.(a.price)}
                className="grid grid-cols-3 px-3 py-0.5 cursor-pointer ob-row-ask relative hover:bg-[var(--bn-bg3)]"
                style={{'--fill-pct':`${a.pct}%`} as any}>
                <div className="font-mono-fi text-xs" style={{color:'var(--bn-red)'}}>{a.price.toFixed(3)}</div>
                <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t0)'}}>{a.qty.toFixed(5)}</div>
                <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t1)'}}>{a.total.toFixed(5)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Spread row */}
        {view==='both' && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-y flex-shrink-0" style={{borderColor:'var(--bn-border)',background:'var(--bn-bg2)'}}>
            <span className="font-mono-fi font-bold text-sm" style={{color: bids[0]?.price>asks[asks.length-1]?.price ? 'var(--bn-red)':'var(--bn-green)'}}>
              {mid.toFixed(3)}
            </span>
            <span className="font-mono-fi text-xs" style={{color:'var(--bn-t1)'}}>≈ ${mid.toFixed(3)}</span>
            <span className="font-mono-fi text-xs ml-auto" style={{color:'var(--bn-t1)'}}>Spread: {spread} ({spreadPct}%)</span>
            <span className="text-xs" style={{color:bids[0]?.price>asks[asks.length-1]?.price?'var(--bn-red)':'var(--bn-green)'}}>
              {bids[0]?.price>asks[asks.length-1]?.price ? '↓' : '↑'}
            </span>
          </div>
        )}

        {/* Bids (buy side) */}
        {(view==='both'||view==='bids') && (
          <div className="overflow-y-auto" style={{flex:1}}>
            {bids.map((b,i) => (
              <div key={i} onClick={() => onClickPrice?.(b.price)}
                className="grid grid-cols-3 px-3 py-0.5 cursor-pointer ob-row-bid relative hover:bg-[var(--bn-bg3)]"
                style={{'--fill-pct':`${b.pct}%`} as any}>
                <div className="font-mono-fi text-xs" style={{color:'var(--bn-green)'}}>{b.price.toFixed(3)}</div>
                <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t0)'}}>{b.qty.toFixed(5)}</div>
                <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t1)'}}>{b.total.toFixed(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent trades */}
      <div className="border-t flex-shrink-0" style={{borderColor:'var(--bn-border)',maxHeight:180,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div className="grid grid-cols-3 px-3 py-1" style={{background:'var(--bn-bg2)'}}>
          {['Price (USD)','Amount (MM)','Time'].map(h=>(
            <div key={h} className="text-xs" style={{color:'var(--bn-t1)',textAlign:h==='Price (USD)'?'left':'right'}}>{h}</div>
          ))}
        </div>
        <div className="overflow-y-auto flex-1">
          {trades.map((t,i) => (
            <div key={i} className="grid grid-cols-3 px-3 py-0.5">
              <div className="font-mono-fi text-xs" style={{color:t.side==='B'?'var(--bn-green)':'var(--bn-red)'}}>{t.price.toFixed(3)}</div>
              <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t0)'}}>{t.qty.toFixed(5)}</div>
              <div className="font-mono-fi text-xs text-right" style={{color:'var(--bn-t1)'}}>{t.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
