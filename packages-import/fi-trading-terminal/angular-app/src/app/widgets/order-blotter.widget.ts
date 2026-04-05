import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import { ModuleRegistry, type ColDef, type ICellRendererParams } from 'ag-grid-community';
import { fiGridTheme } from '../services/ag-grid-theme';
import { SharedStateService } from '../services/shared-state.service';

ModuleRegistry.registerModules([AllEnterpriseModule]);
LicenseManager.setLicenseKey('');

@Component({
  selector: 'order-blotter-widget',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="display:flex;justify-content:flex-end;padding:4px 10px;flex-shrink:0">
        <button
          *ngFor="let f of filters"
          (click)="shared.orderFilter.set(f)"
          class="font-mono-fi"
          style="font-size:9px;padding:2px 8px;margin-left:3px;border-radius:2px;cursor:pointer"
          [style.background]="shared.orderFilter() === f ? 'var(--bn-border)' : 'transparent'"
          [style.border]="'1px solid var(--bn-border)'"
          [style.color]="shared.orderFilter() === f ? 'var(--bn-t0)' : 'var(--bn-t1)'"
        >
          {{ f }}
        </button>
      </div>
      <div style="flex:1;overflow:hidden">
        <ag-grid-angular
          style="width:100%;height:100%"
          [theme]="gridTheme"
          [rowData]="filteredOrders"
          [columnDefs]="colDefs"
          [defaultColDef]="defaultColDef"
          [headerHeight]="28"
          [rowHeight]="26"
          (rowClicked)="onRowClicked($event)"
        />
      </div>
    </div>
  `,
})
export class OrderBlotterWidget {
  @Input() api: any;
  @Input() panel: any;
  shared = inject(SharedStateService);
  filters = ['All', 'Filled', 'Partial', 'Pending', 'Cancelled'];

  gridTheme = fiGridTheme;

  colDefs: ColDef[] = [
    {
      field: 'time',
      headerName: 'TIME',
      flex: 0.6,
      cellStyle: { color: 'var(--bn-t2)', fontSize: '9px' },
    },
    {
      field: 'bond',
      headerName: 'BOND',
      flex: 1,
      cellStyle: { color: '#00bcd4' },
    },
    {
      field: 'side',
      headerName: 'SIDE',
      flex: 0.5,
      cellRenderer: (p: ICellRendererParams) => {
        const c = p.value === 'Buy' ? 'var(--bn-green)' : 'var(--bn-red)';
        return `<span style="font-size:9px;font-weight:700;color:${c}">${String(p.value).toUpperCase()}</span>`;
      },
    },
    {
      field: 'type',
      headerName: 'TYPE',
      flex: 0.5,
      cellStyle: { color: 'var(--bn-t1)', fontSize: '9px' },
    },
    {
      field: 'qty',
      headerName: 'QTY',
      flex: 0.6,
      type: 'numericColumn',
    },
    {
      field: 'filled',
      headerName: 'FILLED',
      flex: 0.6,
      type: 'numericColumn',
      cellRenderer: (p: ICellRendererParams) => {
        const row = p.data;
        const c = row.filled === row.qty ? 'var(--bn-green)' : '#f0b90b';
        return `<span style="color:${c}">${p.value}</span>`;
      },
    },
    {
      field: 'px',
      headerName: 'PX',
      flex: 0.7,
      type: 'numericColumn',
      valueFormatter: (p) => (p.value > 0 ? Number(p.value).toFixed(3) : '---'),
    },
    {
      field: 'ytm',
      headerName: 'YTM',
      flex: 0.6,
      type: 'numericColumn',
      cellStyle: { color: 'var(--bn-t1)' },
      valueFormatter: (p) => (p.value > 0 ? Number(p.value).toFixed(2) + '%' : '---'),
    },
    {
      field: 'status',
      headerName: 'STATUS',
      flex: 0.7,
      cellRenderer: (p: ICellRendererParams) => {
        const s = p.value;
        let cls = 'badge-new';
        if (s === 'Filled') cls = 'badge-filled';
        else if (s === 'Partial') cls = 'badge-partial';
        else if (s === 'Pending') cls = 'badge-new';
        else if (s === 'Cancelled') cls = 'badge-cancel';
        return `<span class="font-mono-fi ${cls}" style="font-size:9px;padding:1px 6px;border-radius:2px">${s}</span>`;
      },
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

  get filteredOrders() {
    const f = this.shared.orderFilter();
    return this.shared.orders().filter((o) => f === 'All' || o.status === f);
  }

  onRowClicked(e: any) {
    if (e.data) this.shared.selectedOrder.set(e.data);
  }
}
