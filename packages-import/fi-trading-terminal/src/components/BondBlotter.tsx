import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import { ModuleRegistry } from 'ag-grid-community';
import { BONDS, type Bond } from '@/data/tradingData';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { fiGridTheme } from '@/lib/agGridTheme';

ModuleRegistry.registerModules([AllEnterpriseModule]);
LicenseManager.setLicenseKey('');

const RatingCell = ({value,data}:ICellRendererParams<Bond>) => {
  const m:Record<string,{bg:string,color:string,border:string}> = {
    aaa:{bg:'rgba(0,203,129,0.1)',color:'var(--bn-green)',border:'rgba(0,203,129,0.25)'},
    aa: {bg:'rgba(0,203,129,0.06)',color:'var(--bn-green)',border:'rgba(0,203,129,0.2)'},
    a:  {bg:'rgba(190,242,100,0.08)',color:'#86cc16',border:'rgba(132,204,22,0.25)'},
    bbb:{bg:'rgba(245,166,35,0.08)',color:'var(--bn-yellow)',border:'rgba(245,166,35,0.25)'},
    hy: {bg:'rgba(246,70,93,0.08)',color:'var(--bn-red)',border:'rgba(246,70,93,0.25)'},
  };
  const s=m[data?.rtgClass||'bbb']||m.bbb;
  return <span className="font-mono-fi px-1.5 py-0.5 rounded-sm font-bold" style={{fontSize:9,letterSpacing:'0.04em',background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{value}</span>;
};
const BidCell=({value}:ICellRendererParams)=><span className="font-mono-fi font-semibold" style={{color:'var(--bn-blue)'}}>  {Number(value).toFixed(3)}</span>;
const AskCell=({value}:ICellRendererParams)=><span className="font-mono-fi font-semibold" style={{color:'var(--bn-red)'}}>{Number(value).toFixed(3)}</span>;
const MidCell=({value}:ICellRendererParams)=><span className="font-mono-fi" style={{color:'var(--bn-t1)'}}>{Number(value).toFixed(3)}</span>;
const SideCell=({value}:ICellRendererParams)=><span className="font-mono-fi font-bold" style={{fontSize:9,letterSpacing:'0.05em',color:value==='Buy'?'var(--fi-green)':'var(--fi-red)'}}>{value==='Buy'?'BUY':'SELL'}</span>;
const OasCell=({value}:ICellRendererParams)=><span className="font-mono-fi" style={{color:Number(value)>80?'var(--fi-amber)':'var(--fi-green)'}}>{Number(value)>0?`+${value}`:value}</span>;
const TickerCell=({value}:ICellRendererParams)=><span className="font-mono-fi font-bold" style={{color:'var(--fi-cyan)',fontSize:11}}>{value}</span>;
const GspdCell=({value}:ICellRendererParams)=><span className="font-mono-fi" style={{color:'var(--bn-t1)'}}>{Number(value)>0?`+${value}`:value}</span>;

interface BondBlotterProps { onSelectBond: (b:Bond)=>void; }

export function BondBlotter({onSelectBond}:BondBlotterProps) {
  const gridApiRef = useRef<GridApi<Bond>|null>(null);
  const [rowData,setRowData]=useState<Bond[]>(BONDS.map(b=>({...b})));
  const [search,setSearch]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');

  const colDefs=useMemo<ColDef<Bond>[]>(()=>[
    {field:'ticker',  headerName:'TICKER', width:68,  cellRenderer:TickerCell,  pinned:'left'},
    {field:'issuer',  headerName:'ISSUER', width:140, cellStyle:{color:'var(--bn-t1)',fontSize:11}, pinned:'left'},
    {field:'cpn',     headerName:'CPN',    width:62,  valueFormatter:p=>p.value?.toFixed(3), type:'numericColumn'},
    {field:'mat',     headerName:'MAT',    width:52,  cellStyle:{color:'var(--bn-t1)'}},
    {field:'cusip',   headerName:'CUSIP',  width:90,  cellStyle:{color:'var(--bn-t2)',fontSize:9}},
    {field:'rtg',     headerName:'RTG',    width:50,  cellRenderer:RatingCell},
    {field:'sector',  headerName:'SECTOR', width:90,  cellStyle:{color:'var(--bn-t1)',fontSize:9}},
    {field:'bid',     headerName:'BID',    width:80,  cellRenderer:BidCell, type:'numericColumn'},
    {field:'ask',     headerName:'ASK',    width:80,  cellRenderer:AskCell, type:'numericColumn'},
    {colId:'mid',     headerName:'MID',    width:80,  type:'numericColumn',  cellRenderer:MidCell,
     valueGetter:p=>p.data?((p.data.bid+p.data.ask)/2):0},
    {field:'ytm',     headerName:'YTM',    width:60,  valueFormatter:p=>p.value?.toFixed(3), type:'numericColumn'},
    {field:'ytw',     headerName:'YTW',    width:60,  valueFormatter:p=>p.value?.toFixed(3), type:'numericColumn', cellStyle:{color:'var(--bn-t1)'}},
    {field:'oas',     headerName:'OAS',    width:56,  cellRenderer:OasCell, type:'numericColumn'},
    {field:'gSpd',    headerName:'G-SPD',  width:58,  cellRenderer:GspdCell, type:'numericColumn'},
    {field:'dur',     headerName:'DUR',    width:54,  valueFormatter:p=>p.value?.toFixed(2), type:'numericColumn'},
    {field:'dv01',    headerName:'DV01',   width:62,  valueFormatter:p=>p.value?.toLocaleString(), type:'numericColumn'},
    {field:'cvx',     headerName:'CVX',    width:50,  valueFormatter:p=>p.value?.toFixed(2), type:'numericColumn'},
    {field:'face',    headerName:'FACE',   width:58,  cellStyle:{color:'var(--bn-t1)'}},
    {field:'side',    headerName:'SIDE',   width:56,  cellRenderer:SideCell},
    {field:'axes',    headerName:'AXES',   width:62,  cellStyle:{color:'var(--bn-t2)',fontSize:9}},
  ],[]);

  const defaultColDef=useMemo<ColDef>(()=>({
    sortable:true,resizable:true,suppressMovable:false,
    cellStyle:{fontFamily:'JetBrains Mono,monospace',fontSize:11,display:'flex',alignItems:'center'},
  }),[]);

  // Live ticking
  useEffect(()=>{
    const id=setInterval(()=>{
      setRowData(prev=>{
        const updates:Bond[]=[];
        const next=prev.map(b=>{
          if(Math.random()<0.22){
            const delta=(Math.random()-0.5)*0.05;
            const nb={...b,bid:+(b.bid+delta).toFixed(3),ask:+(b.ask+delta).toFixed(3)};
            updates.push(nb);
            return nb;
          }
          return b;
        });
        if(gridApiRef.current&&updates.length) gridApiRef.current.applyTransactionAsync({update:updates});
        return next;
      });
    },1200);
    return ()=>clearInterval(id);
  },[]);

  const getRowId=useCallback((p:{data:Bond})=>p.data.id,[]);

  const filteredData=useMemo(()=>rowData.filter(b=>{
    const ms=sectorFilter==='All'||b.sector===sectorFilter;
    const mq=!search||[b.ticker,b.issuer,b.cusip].some(v=>v.toLowerCase().includes(search.toLowerCase()));
    return ms&&mq;
  }),[rowData,sectorFilter,search]);

  const SECTORS=['All','Government','Financials','Technology','Healthcare','Consumer','Telecom'];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar (no title — dock header has it) */}
      <div className="flex items-center justify-between px-3 h-7 border-b flex-shrink-0" style={{background:'var(--fi-bg1)',borderColor:'var(--fi-border)'}}>
        <div className="flex items-center gap-1.5">
          {['All','UST','Corp','Muni','Axes'].map(f=>(
            <button key={f} className="pact">{f}</button>
          ))}
          <div style={{width:1,height:14,background:'var(--fi-border2)'}}/>
          <button className="pact">↓ CSV</button>
          <button className="pact">Cols ▾</button>
        </div>
        <Badge variant="outline" className="font-mono-fi h-4 px-1.5" style={{fontSize:9,background:'var(--fi-bg3)',color:'var(--fi-t1)',borderColor:'var(--fi-border2)'}}>
          {filteredData.length}
        </Badge>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b flex-shrink-0" style={{background:'var(--fi-bg0)',borderColor:'var(--fi-border)'}}>
        {SECTORS.map(f=>(
          <button key={f} onClick={()=>setSectorFilter(f)}
            className="font-mono-fi px-2 py-0.5 rounded-sm border font-medium tracking-wider uppercase transition-colors"
            style={{fontSize:9,background:sectorFilter===f?'rgba(61,158,255,0.1)':'transparent',borderColor:sectorFilter===f?'var(--fi-blue)':'var(--fi-border2)',color:sectorFilter===f?'var(--fi-blue)':'var(--bn-t2)'}}>
            {f}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2" style={{color:'var(--fi-t3)'}}/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ticker / CUSIP / Issuer…"
            className="font-mono-fi h-6 pl-6 pr-2 w-44 rounded-sm" style={{background:'var(--fi-bg2)',color:'var(--fi-t0)',fontSize:11,border:'1px solid var(--fi-border2)'}}/>
        </div>
      </div>
      {/* Grid — parameter-based theming */}
      <div className="flex-1 overflow-hidden">
        <AgGridReact<Bond>
          theme={fiGridTheme}
          rowData={filteredData} columnDefs={colDefs} defaultColDef={defaultColDef}
          getRowId={getRowId} rowSelection={{mode:'singleRow'}} animateRows={true}
          onGridReady={(e:GridReadyEvent)=>{gridApiRef.current=e.api;}}
          onRowClicked={p=>p.data&&onSelectBond(p.data)}
          headerHeight={32} rowHeight={28}
        />
      </div>
    </div>
  );
}
