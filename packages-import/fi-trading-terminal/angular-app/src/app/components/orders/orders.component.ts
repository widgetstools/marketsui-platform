import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TradingDataService, type Order } from '../../services/trading-data.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule],
  template: `
    <div class="orders-layout">
      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">{{ kpis.total }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Filled</div>
          <div class="kpi-value positive">{{ kpis.filled }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Partial</div>
          <div class="kpi-value warning">{{ kpis.partial }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pending</div>
          <div class="kpi-value info">{{ kpis.pending }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cancelled</div>
          <div class="kpi-value muted">{{ kpis.cancelled }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Notional</div>
          <div class="kpi-value">\${{ kpis.totalNotional }}MM</div>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-container">
        <p-table
          [value]="orders"
          [scrollable]="true"
          scrollHeight="flex"
          [rowHover]="true"
          selectionMode="single"
          [(selection)]="selectedOrder"
          styleClass="p-datatable-sm fi-table"
          [tableStyle]="{ 'min-width': '800px' }"
        >
          <ng-template #header>
            <tr>
              <th>Time</th>
              <th>Bond</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Type</th>
              <th>Price</th>
              <th>YTM</th>
              <th>Filled</th>
              <th>Status</th>
            </tr>
          </ng-template>
          <ng-template #body let-order>
            <tr [pSelectableRow]="order">
              <td class="mono">{{ order.time }}</td>
              <td class="mono bond-name">{{ order.bond }}</td>
              <td>
                <span [class]="order.side === 'Buy' ? 'side-buy' : 'side-sell'">
                  {{ order.side }}
                </span>
              </td>
              <td class="mono">{{ order.qty }}</td>
              <td>
                <span class="type-badge">{{ order.type }}</span>
              </td>
              <td class="mono">{{ order.px > 0 ? order.px.toFixed(3) : '—' }}</td>
              <td class="mono">{{ order.ytm > 0 ? order.ytm.toFixed(3) + '%' : '—' }}</td>
              <td class="mono">{{ order.filled }}</td>
              <td>
                <p-tag
                  [value]="order.status"
                  [severity]="getStatusSeverity(order.status)"
                  [rounded]="true"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .orders-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--bn-border);
      background: var(--bn-bg1);
    }
    .kpi-card {
      background: var(--bn-bg2);
      border: 1px solid var(--bn-border);
      border-radius: 3px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: var(--fi-font-xs);
      color: var(--bn-t2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-lg);
      font-weight: 600;
      color: var(--bn-t0);
    }
    .kpi-value.positive { color: var(--bn-green); }
    .kpi-value.warning { color: var(--bn-yellow); }
    .kpi-value.info { color: var(--bn-blue); }
    .kpi-value.muted { color: var(--bn-t2); }
    .table-container {
      flex: 1;
      overflow: hidden;
      background: var(--bn-bg1);
    }
    .mono { font-family: var(--fi-mono); }
    .bond-name { color: var(--bn-yellow); font-weight: 500; }
    .side-buy { color: var(--bn-green); font-weight: 600; font-family: var(--fi-mono); }
    .side-sell { color: var(--bn-red); font-weight: 600; font-family: var(--fi-mono); }
    .type-badge {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-xs);
      padding: 1px 6px;
      border-radius: 2px;
      background: rgba(240, 185, 11, 0.08);
      color: var(--bn-yellow);
      border: 1px solid rgba(240, 185, 11, 0.2);
    }

    /* PrimeNG table overrides using FI design tokens */
    :host ::ng-deep .fi-table {
      font-family: var(--fi-mono);
      font-size: var(--fi-font-sm);
    }
    :host ::ng-deep .fi-table .p-datatable-thead > tr > th {
      background: var(--bn-bg2);
      color: var(--bn-t1);
      font-size: var(--fi-font-xs);
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-color: var(--bn-border);
      padding: 6px 10px;
    }
    :host ::ng-deep .fi-table .p-datatable-tbody > tr > td {
      background: var(--bn-bg1);
      color: var(--bn-t0);
      border-color: var(--bn-border);
      padding: 5px 10px;
    }
    :host ::ng-deep .fi-table .p-datatable-tbody > tr:hover > td {
      background: var(--bn-bg2);
    }
    :host ::ng-deep .fi-table .p-datatable-tbody > tr.p-datatable-row-selected > td {
      background: rgba(240, 185, 11, 0.06);
    }
  `],
})
export class OrdersComponent {
  private tradingData = inject(TradingDataService);
  orders = this.tradingData.getOrders();
  kpis = this.tradingData.getOrderKpis();
  selectedOrder = signal<Order | null>(null);

  getStatusSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'Filled':    return 'success';
      case 'Partial':   return 'warn';
      case 'Pending':   return 'info';
      case 'Cancelled': return 'danger';
      default:          return 'secondary';
    }
  }
}
