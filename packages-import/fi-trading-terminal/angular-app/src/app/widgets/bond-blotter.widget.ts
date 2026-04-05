import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import {
  ModuleRegistry,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type ICellRendererParams,
} from 'ag-grid-community';
import { fiGridTheme } from '../services/ag-grid-theme';
import { BONDS, type Bond } from '../services/trading-data.service';
import { SharedStateService } from '../services/shared-state.service';

ModuleRegistry.registerModules([AllEnterpriseModule]);
LicenseManager.setLicenseKey('');

@Component({
  selector: 'bond-blotter-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <!-- Toolbar -->
    <div
      style="display:flex;align-items:center;justify-content:space-between;padding:0 12px;height:28px;border-bottom:1px solid var(--fi-border);background:var(--fi-bg1);flex-shrink:0"
    >
      <div style="display:flex;align-items:center;gap:6px">
        <button *ngFor="let f of quickFilters" class="pact">{{ f }}</button>
        <div style="width:1px;height:14px;background:var(--fi-border2)"></div>
        <button class="pact">CSV</button>
        <button class="pact">Cols</button>
      </div>
      <span
        class="font-mono-fi"
        style="font-size:9px;padding:1px 6px;border-radius:2px;background:var(--fi-bg3);color:var(--fi-t1);border:1px solid var(--fi-border2)"
        >{{ filteredData.length }}</span
      >
    </div>
    <!-- Sector filters -->
    <div
      style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-bottom:1px solid var(--fi-border);background:var(--fi-bg0);flex-shrink:0"
    >
      <button
        *ngFor="let s of sectors"
        (click)="sectorFilter = s"
        class="font-mono-fi"
        [style.fontSize.px]="9"
        [style.padding]="'2px 8px'"
        [style.borderRadius.px]="2"
        [style.background]="sectorFilter === s ? 'rgba(61,158,255,0.1)' : 'transparent'"
        [style.borderColor]="sectorFilter === s ? 'var(--fi-blue)' : 'var(--fi-border2)'"
        [style.color]="sectorFilter === s ? 'var(--fi-blue)' : 'var(--bn-t2)'"
        style="border:1px solid;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;cursor:pointer"
      >
        {{ s }}
      </button>
      <div style="margin-left:auto;position:relative">
        <input
          [(ngModel)]="search"
          placeholder="Ticker / CUSIP / Issuer..."
          class="font-mono-fi"
          style="height:24px;padding:0 8px 0 24px;width:176px;border-radius:2px;background:var(--fi-bg2);color:var(--fi-t0);font-size:11px;border:1px solid var(--fi-border2);outline:none"
        />
      </div>
    </div>
    <!-- Grid -->
    <div style="flex:1;overflow:hidden">
      <ag-grid-angular
        style="width:100%;height:100%"
        [theme]="gridTheme"
        [rowData]="filteredData"
        [columnDefs]="colDefs"
        [defaultColDef]="defaultColDef"
        [getRowId]="getRowId"
        [animateRows]="true"
        [headerHeight]="32"
        [rowHeight]="28"
        (gridReady)="onGridReady($event)"
        (rowClicked)="onRowClicked($event)"
      />
    </div>
  `,
})
export class BondBlotterWidget implements OnInit, OnDestroy {
  @Input() api: any;
  @Input() panel: any;

  private shared = inject(SharedStateService);
  private tickInterval: any;

  gridTheme = fiGridTheme;
  gridApi: GridApi<Bond> | null = null;
  rowData: Bond[] = [];
  search = '';
  sectorFilter = 'All';
  quickFilters = ['All', 'UST', 'Corp', 'Muni', 'Axes'];
  sectors = ['All', 'Government', 'Financials', 'Technology', 'Healthcare', 'Consumer', 'Telecom'];

  colDefs: ColDef<Bond>[] = [
    {
      field: 'ticker',
      headerName: 'TICKER',
      minWidth: 60,
      flex: 0.7,
      pinned: 'left',
      cellStyle: { color: 'var(--fi-cyan)', fontWeight: 700, fontSize: '11px' },
    },
    {
      field: 'issuer',
      headerName: 'ISSUER',
      minWidth: 100,
      flex: 1.2,
      cellStyle: { color: 'var(--bn-t1)', fontSize: '11px' },
    },
    {
      field: 'cpn',
      headerName: 'CPN',
      minWidth: 55,
      flex: 0.6,
      valueFormatter: (p) => p.value?.toFixed(3),
      type: 'numericColumn',
    },
    {
      field: 'mat',
      headerName: 'MAT',
      minWidth: 50,
      flex: 0.5,
      cellStyle: { color: 'var(--bn-t1)' },
    },
    {
      field: 'cusip',
      headerName: 'CUSIP',
      minWidth: 80,
      flex: 0.8,
      cellStyle: { color: 'var(--bn-t2)', fontSize: '9px' },
    },
    {
      field: 'rtg',
      headerName: 'RTG',
      minWidth: 45,
      flex: 0.5,
      cellRenderer: (p: ICellRendererParams<Bond>) => {
        const m: Record<string, { bg: string; color: string; border: string }> = {
          aaa: {
            bg: 'rgba(45,212,191,0.1)',
            color: 'var(--bn-green)',
            border: 'rgba(45,212,191,0.25)',
          },
          aa: {
            bg: 'rgba(45,212,191,0.06)',
            color: 'var(--bn-green)',
            border: 'rgba(45,212,191,0.2)',
          },
          a: { bg: 'rgba(190,242,100,0.08)', color: '#86cc16', border: 'rgba(132,204,22,0.25)' },
          bbb: {
            bg: 'rgba(245,166,35,0.08)',
            color: 'var(--bn-yellow)',
            border: 'rgba(245,166,35,0.25)',
          },
          hy: {
            bg: 'rgba(248,113,113,0.08)',
            color: 'var(--bn-red)',
            border: 'rgba(248,113,113,0.25)',
          },
        };
        const s = m[p.data?.rtgClass || 'bbb'] || m['bbb'];
        return `<span style="font-family:JetBrains Mono,monospace;font-size:9px;font-weight:700;letter-spacing:0.04em;padding:1px 6px;border-radius:2px;background:${s.bg};color:${s.color};border:1px solid ${s.border}">${p.value}</span>`;
      },
    },
    {
      field: 'sector',
      headerName: 'SECTOR',
      minWidth: 70,
      flex: 0.8,
      cellStyle: { color: 'var(--bn-t1)', fontSize: '9px' },
    },
    {
      field: 'bid',
      headerName: 'BID',
      minWidth: 65,
      flex: 0.7,
      type: 'numericColumn',
      cellStyle: { color: 'var(--bn-blue)', fontWeight: 600 },
      valueFormatter: (p) => Number(p.value).toFixed(3),
    },
    {
      field: 'ask',
      headerName: 'ASK',
      minWidth: 65,
      flex: 0.7,
      type: 'numericColumn',
      cellStyle: { color: 'var(--bn-red)', fontWeight: 600 },
      valueFormatter: (p) => Number(p.value).toFixed(3),
    },
    {
      colId: 'mid',
      headerName: 'MID',
      minWidth: 60,
      flex: 0.7,
      type: 'numericColumn',
      cellStyle: { color: 'var(--bn-t1)' },
      valueGetter: (p) => (p.data ? (p.data.bid + p.data.ask) / 2 : 0),
      valueFormatter: (p) => Number(p.value).toFixed(3),
    },
    {
      field: 'ytm',
      headerName: 'YTM',
      minWidth: 50,
      flex: 0.6,
      valueFormatter: (p) => p.value?.toFixed(3),
      type: 'numericColumn',
    },
    {
      field: 'ytw',
      headerName: 'YTW',
      minWidth: 50,
      flex: 0.6,
      valueFormatter: (p) => p.value?.toFixed(3),
      type: 'numericColumn',
      cellStyle: { color: 'var(--bn-t1)' },
    },
    {
      field: 'oas',
      headerName: 'OAS',
      minWidth: 50,
      flex: 0.5,
      type: 'numericColumn',
      cellRenderer: (p: ICellRendererParams) => {
        const v = Number(p.value);
        const c = v > 80 ? 'var(--fi-amber)' : 'var(--fi-green)';
        return `<span style="color:${c}">${v > 0 ? '+' + v : v}</span>`;
      },
    },
    {
      field: 'dur',
      headerName: 'DUR',
      minWidth: 50,
      flex: 0.5,
      valueFormatter: (p) => p.value?.toFixed(2),
      type: 'numericColumn',
    },
    {
      field: 'dv01',
      headerName: 'DV01',
      minWidth: 50,
      flex: 0.6,
      valueFormatter: (p) => p.value?.toLocaleString(),
      type: 'numericColumn',
    },
    {
      field: 'gSpd',
      headerName: 'G-SPD',
      minWidth: 50,
      flex: 0.5,
      type: 'numericColumn',
      cellRenderer: (p: ICellRendererParams) => {
        const v = Number(p.value);
        return `<span style="color:var(--bn-t1)">${v > 0 ? '+' + v : v}</span>`;
      },
    },
    {
      field: 'cvx',
      headerName: 'CVX',
      minWidth: 45,
      flex: 0.5,
      valueFormatter: (p) => p.value?.toFixed(2),
      type: 'numericColumn',
    },
    {
      field: 'face',
      headerName: 'FACE',
      minWidth: 50,
      flex: 0.5,
      cellStyle: { color: 'var(--bn-t1)' },
    },
    {
      field: 'side',
      headerName: 'SIDE',
      minWidth: 45,
      flex: 0.5,
      cellRenderer: (p: ICellRendererParams) => {
        const c = p.value === 'Buy' ? 'var(--fi-green)' : 'var(--fi-red)';
        return `<span style="font-size:9px;font-weight:700;letter-spacing:0.05em;color:${c}">${p.value === 'Buy' ? 'BUY' : 'SELL'}</span>`;
      },
    },
    {
      field: 'axes',
      headerName: 'AXES',
      minWidth: 50,
      flex: 0.5,
      cellStyle: { color: 'var(--bn-t2)', fontSize: '9px' },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    suppressMovable: true,
    cellStyle: {
      fontFamily: 'JetBrains Mono,monospace',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
    },
  };

  get filteredData(): Bond[] {
    return this.rowData.filter((b) => {
      const ms = this.sectorFilter === 'All' || b.sector === this.sectorFilter;
      const mq =
        !this.search ||
        [b.ticker, b.issuer, b.cusip].some((v) =>
          v.toLowerCase().includes(this.search.toLowerCase()),
        );
      return ms && mq;
    });
  }

  getRowId = (p: { data: Bond }) => p.data.id;

  ngOnInit() {
    this.rowData = BONDS.map((b) => ({ ...b }));
    this.tickInterval = setInterval(() => {
      const updates: Bond[] = [];
      this.rowData = this.rowData.map((b) => {
        if (Math.random() < 0.22) {
          const delta = (Math.random() - 0.5) * 0.05;
          const nb = { ...b, bid: +(b.bid + delta).toFixed(3), ask: +(b.ask + delta).toFixed(3) };
          updates.push(nb);
          return nb;
        }
        return b;
      });
      if (this.gridApi && updates.length) {
        this.gridApi.applyTransactionAsync({ update: updates });
      }
    }, 1200);
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  onGridReady(e: GridReadyEvent) {
    this.gridApi = e.api;
  }

  onRowClicked(e: any) {
    if (e.data) this.shared.selectedBond.set(e.data);
  }
}
