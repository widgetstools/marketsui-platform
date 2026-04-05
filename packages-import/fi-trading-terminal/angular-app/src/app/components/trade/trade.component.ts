import { Component, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  type ColDef,
  type GridReadyEvent,
  type RowClickedEvent,
  ModuleRegistry,
  colorSchemeDark,
  colorSchemeLight,
  themeQuartz,
} from 'ag-grid-community';
import { Bond, BONDS } from '../../services/trading-data.service';

ModuleRegistry.registerModules([AllCommunityModule]);

// Build the FI grid theme with dark and light color scheme parts
const fiGridTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withParams({
    backgroundColor: '#161a1e',
    foregroundColor: '#eaecef',
    headerBackgroundColor: '#1e2329',
    headerTextColor: '#a0a8b4',
    oddRowBackgroundColor: '#161a1e',
    rowHoverColor: '#1e2329',
    selectedRowBackgroundColor: 'rgba(240,185,11,0.08)',
    borderColor: '#313944',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    headerFontSize: 10,
    cellHorizontalPaddingScale: 0.6,
  });

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <div class="trade-layout">
      <div class="blotter-panel">
        <div class="panel-header">Bond Blotter</div>
        <ag-grid-angular
          class="grid-container"
          [theme]="gridTheme"
          [rowData]="bonds"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="rowSelection"
          [headerHeight]="28"
          [rowHeight]="26"
          (gridReady)="onGridReady($event)"
          (rowClicked)="onRowClicked($event)"
        />
      </div>

      <div class="detail-panel">
        <div class="panel-header">Bond Detail</div>
        <div class="detail-content">
          @if (selectedBond(); as bond) {
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Issuer</span>
                <span class="detail-value">{{ bond.issuer }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ticker</span>
                <span class="detail-value ticker-val">{{ bond.ticker }} {{ bond.cpn }}% {{ bond.mat }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">CUSIP</span>
                <span class="detail-value mono">{{ bond.cusip }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Rating</span>
                <span class="detail-value" [class]="'rtg-' + bond.rtgClass">{{ bond.rtg }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Sector</span>
                <span class="detail-value">{{ bond.sector }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seniority</span>
                <span class="detail-value">{{ bond.seniority }}</span>
              </div>
              <div class="kpi-strip">
                <div class="kpi-card">
                  <div class="kpi-label">Bid</div>
                  <div class="kpi-value positive">{{ bond.bid.toFixed(3) }}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Ask</div>
                  <div class="kpi-value negative">{{ bond.ask.toFixed(3) }}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">YTM</div>
                  <div class="kpi-value">{{ bond.ytm.toFixed(3) }}%</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">OAS</div>
                  <div class="kpi-value">{{ bond.oas }}bp</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Duration</div>
                  <div class="kpi-value">{{ bond.dur.toFixed(2) }}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">DV01</div>
                  <div class="kpi-value">{{ bond.dv01 }}</div>
                </div>
              </div>
              <div class="chart-placeholder">
                <div class="chart-placeholder-text">Price Chart Placeholder</div>
                <div class="chart-placeholder-sub">{{ bond.ticker }} {{ bond.cpn }}% {{ bond.mat }}</div>
              </div>
            </div>
          } @else {
            <div class="no-selection">Select a bond from the blotter</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .trade-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      height: 100%;
      gap: 1px;
      background: var(--bn-border);
    }
    .blotter-panel, .detail-panel {
      display: flex;
      flex-direction: column;
      background: var(--bn-bg1);
      overflow: hidden;
    }
    .panel-header {
      padding: 6px 12px;
      font-family: var(--fi-sans);
      font-size: var(--fi-font-xs);
      font-weight: 500;
      color: var(--bn-t1);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--bn-border);
      background: var(--bn-bg2);
    }
    .grid-container {
      flex: 1;
      width: 100%;
    }
    .detail-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    .detail-grid { display: flex; flex-direction: column; gap: 6px; }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
      border-bottom: 1px solid var(--bn-border);
    }
    .detail-label {
      font-size: var(--fi-font-xs);
      color: var(--bn-t2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .detail-value {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-sm);
      color: var(--bn-t0);
    }
    .ticker-val { color: var(--bn-yellow); font-weight: 600; }
    .mono { font-family: var(--fi-mono); }
    .rtg-aaa { color: var(--bn-green); }
    .rtg-aa { color: var(--bn-green2); }
    .rtg-a { color: var(--bn-blue); }
    .rtg-bbb { color: var(--bn-yellow); }
    .rtg-hy { color: var(--bn-red); }
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-top: 10px;
    }
    .kpi-card {
      background: var(--bn-bg2);
      border: 1px solid var(--bn-border);
      border-radius: 3px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-label {
      font-size: var(--fi-font-xs);
      color: var(--bn-t2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-md);
      font-weight: 600;
      color: var(--bn-t0);
    }
    .kpi-value.positive { color: var(--bn-green); }
    .kpi-value.negative { color: var(--bn-red); }
    .chart-placeholder {
      margin-top: 12px;
      background: var(--bn-bg2);
      border: 1px solid var(--bn-border);
      border-radius: 3px;
      height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .chart-placeholder-text {
      font-size: var(--fi-font-sm);
      color: var(--bn-t2);
    }
    .chart-placeholder-sub {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-xs);
      color: var(--bn-t3);
      margin-top: 4px;
    }
    .no-selection {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--bn-t3);
      font-size: var(--fi-font-sm);
    }
  `],
})
export class TradeComponent {
  bonds = BONDS;
  selectedBond = signal<Bond | null>(BONDS[0]);
  gridTheme = fiGridTheme;

  rowSelection: any = { mode: 'singleRow', checkboxes: false, enableClickSelection: true };

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    suppressMovable: true,
  };

  columnDefs: ColDef<Bond>[] = [
    {
      headerName: 'TICKER',
      field: 'ticker',
      width: 70,
      pinned: 'left',
      cellStyle: { fontWeight: '600', color: 'var(--bn-yellow)' },
    },
    { headerName: 'CPN', field: 'cpn', width: 65, valueFormatter: (p) => p.value?.toFixed(3) ?? '' },
    { headerName: 'MAT', field: 'mat', width: 65 },
    { headerName: 'RTG', field: 'rtg', width: 55, cellClassRules: {
      'rtg-aaa': (p) => p.data?.rtgClass === 'aaa',
      'rtg-aa': (p) => p.data?.rtgClass === 'aa',
      'rtg-a': (p) => p.data?.rtgClass === 'a',
      'rtg-bbb': (p) => p.data?.rtgClass === 'bbb',
      'rtg-hy': (p) => p.data?.rtgClass === 'hy',
    }},
    { headerName: 'SECTOR', field: 'sector', width: 90 },
    {
      headerName: 'BID',
      field: 'bid',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(3) ?? '',
      cellStyle: { color: 'var(--bn-green)' },
    },
    {
      headerName: 'ASK',
      field: 'ask',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(3) ?? '',
      cellStyle: { color: 'var(--bn-red)' },
    },
    {
      headerName: 'YTM',
      field: 'ytm',
      width: 65,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(3) ?? '',
    },
    { headerName: 'OAS', field: 'oas', width: 55, type: 'numericColumn' },
    { headerName: 'G-SPD', field: 'gSpd', width: 60, type: 'numericColumn' },
    { headerName: 'DUR', field: 'dur', width: 60, type: 'numericColumn', valueFormatter: (p) => p.value?.toFixed(2) ?? '' },
    { headerName: 'DV01', field: 'dv01', width: 60, type: 'numericColumn' },
    { headerName: 'FACE', field: 'face', width: 60 },
    {
      headerName: 'SIDE',
      field: 'side',
      width: 55,
      cellStyle: (params) => ({
        color: params.value === 'Buy' ? 'var(--bn-green)' : 'var(--bn-red)',
        fontWeight: '600',
      }),
    },
    { headerName: 'AXES', field: 'axes', width: 65 },
  ];

  onGridReady(event: GridReadyEvent) {
    event.api.sizeColumnsToFit();
  }

  onRowClicked(event: RowClickedEvent<Bond>) {
    if (event.data) {
      this.selectedBond.set(event.data);
    }
  }
}
