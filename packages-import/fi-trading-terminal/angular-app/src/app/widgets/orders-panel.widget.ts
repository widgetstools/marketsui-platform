import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INITIAL_ORDERS, INITIAL_TRADES } from '../services/trading-data.service';

@Component({
  selector: 'orders-panel-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1)">
      <!-- Tabs -->
      <div
        style="display:flex;align-items:center;border-bottom:1px solid var(--bn-border);flex-shrink:0"
      >
        <button
          *ngFor="let t of tabNames"
          (click)="tab = t.key"
          class="bn-tab"
          [class.active]="tab === t.key"
        >
          {{ t.label }}
        </button>
        <div style="margin-left:auto;display:flex;align-items:center;gap:16px;padding-right:16px">
          <label
            style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--bn-t1);cursor:pointer"
          >
            <input type="checkbox" style="accent-color:var(--bn-yellow)" /> Hide Other Pairs
          </label>
          <button
            style="font-size:11px;color:var(--bn-yellow);background:none;border:none;cursor:pointer"
          >
            Cancel All
          </button>
        </div>
      </div>
      <!-- Content -->
      <div style="flex:1;overflow-y:auto">
        <!-- Order History -->
        <table *ngIf="tab === 'orders'" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--bn-bg2);position:sticky;top:0">
              <th
                *ngFor="let h of orderHeaders"
                style="font-size:11px;color:var(--bn-t1);padding:5px 12px;border-bottom:1px solid var(--bn-border);text-align:left;font-weight:400"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders" style="border-bottom:1px solid rgba(43,49,57,0.5)">
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                {{ o.time }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ o.bond }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                {{ o.type }}
              </td>
              <td
                class="font-mono-fi font-bold"
                style="padding:6px 12px;font-size:11px"
                [style.color]="o.side === 'Buy' ? 'var(--bn-green)' : 'var(--bn-red)'"
              >
                {{ o.side }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ o.px > 0 ? o.px.toFixed(3) : '---' }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ o.qty }}
              </td>
              <td
                class="font-mono-fi"
                style="padding:6px 12px;font-size:11px"
                [style.color]="o.filled === o.qty ? 'var(--bn-green)' : 'var(--bn-yellow)'"
              >
                {{ o.filled }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                {{ o.px > 0 ? calcTotal(o) : '---' }}
              </td>
              <td style="padding:6px 12px">
                <span
                  class="font-mono-fi"
                  style="font-size:11px;padding:1px 6px;border-radius:2px"
                  [ngClass]="statusClass(o.status)"
                  >{{ o.status }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Trade History -->
        <table *ngIf="tab === 'trades'" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--bn-bg2);position:sticky;top:0">
              <th
                *ngFor="let h of tradeHeaders"
                style="font-size:11px;color:var(--bn-t1);padding:5px 12px;border-bottom:1px solid var(--bn-border);text-align:left;font-weight:400"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of trades" style="border-bottom:1px solid rgba(43,49,57,0.5)">
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                {{ t.time }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ t.bond }}
              </td>
              <td
                class="font-mono-fi font-bold"
                style="padding:6px 12px;font-size:11px"
                [style.color]="t.side === 'B' ? 'var(--bn-green)' : 'var(--bn-red)'"
              >
                {{ t.side === 'B' ? 'Buy' : 'Sell' }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ t.price.toFixed(3) }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t0)">
                {{ t.size }}
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                ---
              </td>
              <td class="font-mono-fi" style="padding:6px 12px;font-size:11px;color:var(--bn-t1)">
                ---
              </td>
              <td style="padding:6px 12px">
                <span
                  class="font-mono-fi"
                  style="font-size:11px;padding:1px 6px;border-radius:2px"
                  [ngClass]="statusClass(t.status)"
                  >{{ t.status }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Funds -->
        <div
          *ngIf="tab === 'funds'"
          style="padding:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px"
        >
          <div
            *ngFor="let f of funds"
            style="padding:12px;border-radius:4px;border:1px solid var(--bn-border2);background:var(--bn-bg2)"
          >
            <div class="font-bold" style="color:var(--bn-t0);margin-bottom:4px">{{ f.asset }}</div>
            <div style="font-size:11px;color:var(--bn-t1)">
              Available: <span class="font-mono-fi" style="color:var(--bn-t0)">{{ f.avail }}</span>
            </div>
            <div style="font-size:11px;color:var(--bn-t1)">
              In Order: <span class="font-mono-fi" style="color:var(--bn-t0)">{{ f.locked }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OrdersPanelWidget {
  @Input() api: any;
  @Input() panel: any;

  tab = 'orders';
  tabNames = [
    { key: 'orders', label: 'Order History' },
    { key: 'trades', label: 'Trade History' },
    { key: 'open', label: 'Open Orders (0)' },
    { key: 'funds', label: 'Funds' },
  ];
  orderHeaders = ['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Filled', 'Total', 'Status'];
  tradeHeaders = ['Date', 'Pair', 'Side', 'Price', 'Amount', 'Total', 'Fee', 'Status'];
  orders = INITIAL_ORDERS;
  trades = INITIAL_TRADES;
  funds = [
    { asset: 'USD', avail: '0.00', locked: '0.00' },
    { asset: 'UST', avail: '0.00', locked: '0.00' },
    { asset: 'AAPL', avail: '0.00', locked: '0.00' },
  ];

  calcTotal(o: any): string {
    const val = parseFloat(o.qty.replace(/[$MM,]/g, ''));
    return (o.px * val).toFixed(0);
  }

  statusClass(s: string): string {
    if (s === 'Filled') return 'badge-filled';
    if (s === 'Partial') return 'badge-partial';
    if (s === 'Pending') return 'badge-new';
    if (s === 'Cancelled') return 'badge-cancel';
    return 'badge-new';
  }
}
