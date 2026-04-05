import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedStateService } from '../services/shared-state.service';

@Component({
  selector: 'order-blotter-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden">
      <div style="display:flex;justify-content:flex-end;padding:4px 10px;flex-shrink:0">
        <button *ngFor="let f of filters" (click)="shared.orderFilter.set(f)" class="font-mono-fi"
          style="font-size:9px;padding:2px 8px;margin-left:3px;border-radius:2px;cursor:pointer"
          [style.background]="shared.orderFilter()===f?'var(--bn-border)':'transparent'"
          [style.border]="'1px solid var(--bn-border)'"
          [style.color]="shared.orderFilter()===f?'var(--bn-t0)':'var(--bn-t1)'">{{f}}</button>
      </div>
      <div style="flex:1;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--bn-bg2);position:sticky;top:0;z-index:1">
            <th *ngFor="let h of headers" style="font-size:11px;color:var(--bn-t1);padding:5px 10px;border-bottom:1px solid var(--bn-border);font-weight:400;letter-spacing:0.04em"
              [style.textAlign]="h==='BOND'||h==='TIME'?'left':'right'">{{h}}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of filteredOrders" (click)="shared.selectedOrder.set(o)"
              style="border-bottom:1px solid rgba(43,49,57,0.5);cursor:pointer"
              [style.background]="shared.selectedOrder()?.id===o.id?'var(--bn-bg2)':'transparent'">
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:9px;color:var(--bn-t2)">{{o.time}}</td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:#00bcd4">{{o.bond}}</td>
              <td style="padding:5px 10px"><span style="font-size:9px;font-weight:700;font-family:JetBrains Mono,monospace" [style.color]="o.side==='Buy'?'var(--bn-green)':'var(--bn-red)'">{{o.side.toUpperCase()}}</span></td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:9px;color:var(--bn-t1);text-align:right">{{o.type}}</td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bn-t0);text-align:right">{{o.qty}}</td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:11px;text-align:right" [style.color]="o.filled===o.qty?'var(--bn-green)':'#f0b90b'">{{o.filled}}</td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bn-t0);text-align:right">{{o.px>0?o.px.toFixed(3):'---'}}</td>
              <td style="padding:5px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bn-t1);text-align:right">{{o.ytm>0?o.ytm.toFixed(2)+'%':'---'}}</td>
              <td style="padding:5px 10px;text-align:right"><span class="font-mono-fi" style="font-size:9px;padding:1px 6px;border-radius:2px" [ngClass]="statusClass(o.status)">{{o.status}}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class OrderBlotterWidget {
  @Input() api: any;
  @Input() panel: any;
  shared = inject(SharedStateService);
  headers = ['TIME','BOND','SIDE','TYPE','QTY','FILLED','PX','YTM','STATUS'];
  filters = ['All','Filled','Partial','Pending','Cancelled'];

  get filteredOrders() {
    const f = this.shared.orderFilter();
    return this.shared.orders().filter(o => f === 'All' || o.status === f);
  }

  statusClass(s: string) {
    if (s === 'Filled') return 'badge-filled';
    if (s === 'Partial') return 'badge-partial';
    if (s === 'Pending') return 'badge-new';
    if (s === 'Cancelled') return 'badge-cancel';
    return 'badge-new';
  }
}
