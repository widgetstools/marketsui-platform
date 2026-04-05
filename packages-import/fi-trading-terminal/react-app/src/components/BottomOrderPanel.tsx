import { useState } from 'react';
import type { Bond } from '@/data/tradingData';
import { INITIAL_ORDERS, INITIAL_TRADES } from '@/data/tradingData';

interface BottomOrderPanelProps { bond: Bond | null; }

export function BottomOrderPanel({ bond }: BottomOrderPanelProps) {
  const [tab, setTab] = useState('Order History');
  const TABS = ['Order History', 'Trade History', 'Open Orders (0)', 'Funds'];

  const statusStyle = (s:string) => {
    if(s==='Filled')    return 'badge-filled';
    if(s==='Partial')   return 'badge-partial';
    if(s==='Pending')   return 'badge-new';
    if(s==='Cancelled') return 'badge-cancel';
    return 'badge-new';
  };

  return (
    <div className="flex flex-col h-full border-t" style={{background:'var(--bn-bg1)',borderColor:'var(--bn-border)'}}>
      {/* Tabs */}
      <div className="flex items-center border-b flex-shrink-0" style={{borderColor:'var(--bn-border)'}}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t.replace(/ \(\d+\)/,''))}
            className={`bn-tab ${tab===t.replace(/ \(\d+\)/,'')?'active':''}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 pr-4">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{color:'var(--bn-t1)'}}>
            <input type="checkbox" className="rounded" style={{accentColor:'var(--bn-yellow)'}}/> Hide Other Pairs
          </label>
          <button className="text-xs" style={{color:'var(--bn-yellow)'}}>Cancel All</button>
          <button className="text-xs" style={{color:'var(--bn-t1)'}}>▾</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'Open Orders' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8" style={{color:'var(--bn-t2)'}}>
            <div className="text-3xl mb-2 opacity-20">📋</div>
            <div className="text-sm">You have no open orders.</div>
          </div>
        )}
        {tab === 'Order History' && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{background:'var(--bn-bg2)',position:'sticky',top:0}}>
                {['Date','Pair','Type','Side','Price','Amount','Filled','Total','Status'].map(h=>(
                  <th key={h} className="text-xs px-3 py-2 text-left border-b" style={{color:'var(--bn-t1)',borderColor:'var(--bn-border)',fontWeight:400}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INITIAL_ORDERS.map(o=>(
                <tr key={o.id} className="border-b hover:bg-[var(--bn-bg2)]" style={{borderColor:'rgba(43,49,57,0.5)'}}>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>{o.time}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{o.bond}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>{o.type}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs font-bold" style={{color:o.side==='Buy'?'var(--bn-green)':'var(--bn-red)'}}>{o.side}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{o.px>0?o.px.toFixed(3):'—'}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{o.qty}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:o.filled===o.qty?'var(--bn-green)':'var(--bn-yellow)'}}>{o.filled}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>{o.px>0?(+o.px*parseFloat(o.qty.replace('$',''))).toFixed(0):'—'}</td>
                  <td className="px-3 py-1.5">
                    <span className={`font-mono-fi text-xs px-1.5 py-0.5 rounded-sm ${statusStyle(o.status)}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'Trade History' && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{background:'var(--bn-bg2)',position:'sticky',top:0}}>
                {['Date','Pair','Side','Price','Amount','Total','Fee','Status'].map(h=>(
                  <th key={h} className="text-xs px-3 py-2 text-left border-b" style={{color:'var(--bn-t1)',borderColor:'var(--bn-border)',fontWeight:400}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INITIAL_TRADES.map(t=>(
                <tr key={t.id} className="border-b hover:bg-[var(--bn-bg2)]" style={{borderColor:'rgba(43,49,57,0.5)'}}>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>{t.time}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{t.bond}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs font-bold" style={{color:t.side==='B'?'var(--bn-green)':'var(--bn-red)'}}>{t.side==='B'?'Buy':'Sell'}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{t.price.toFixed(3)}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t0)'}}>{t.size}</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>—</td>
                  <td className="font-mono-fi px-3 py-1.5 text-xs" style={{color:'var(--bn-t1)'}}>—</td>
                  <td className="px-3 py-1.5"><span className={`font-mono-fi text-xs px-1.5 py-0.5 rounded-sm ${statusStyle(t.status)}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'Funds' && (
          <div className="p-4 grid grid-cols-4 gap-4">
            {[{asset:'USD',avail:'0.00',locked:'0.00'},{asset:'UST',avail:'0.00',locked:'0.00'},{asset:'AAPL',avail:'0.00',locked:'0.00'}].map(f=>(
              <div key={f.asset} className="p-3 rounded border" style={{background:'var(--bn-bg2)',borderColor:'var(--bn-border2)'}}>
                <div className="font-bold mb-1" style={{color:'var(--bn-t0)'}}>{f.asset}</div>
                <div className="text-xs" style={{color:'var(--bn-t1)'}}>Available: <span className="font-mono-fi" style={{color:'var(--bn-t0)'}}>{f.avail}</span></div>
                <div className="text-xs" style={{color:'var(--bn-t1)'}}>In Order: <span className="font-mono-fi" style={{color:'var(--bn-t0)'}}>{f.locked}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
