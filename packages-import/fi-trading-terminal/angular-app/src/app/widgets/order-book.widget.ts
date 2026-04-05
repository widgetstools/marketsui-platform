import { Component, Input, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedStateService } from '../services/shared-state.service';

interface Level {
  price: number;
  qty: number;
  total: number;
  pct: number;
}

function genLevels(mid: number, side: 'ask' | 'bid', n = 14): Level[] {
  const levels: Level[] = [];
  let cumQty = 0;
  for (let i = 0; i < n; i++) {
    const offset = side === 'ask' ? (i + 0.5) * 0.025 : -(i + 0.5) * 0.025;
    const price = +(mid + offset).toFixed(3);
    const qty = +(Math.random() * 0.5 + 0.001).toFixed(5);
    cumQty += qty;
    levels.push({ price, qty, total: +cumQty.toFixed(5), pct: 0 });
  }
  const maxTotal = levels[levels.length - 1].total;
  return levels.map((l) => ({ ...l, pct: (l.total / maxTotal) * 100 }));
}

@Component({
  selector: 'order-book-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1)">
      <!-- Toolbar -->
      <div
        style="display:flex;align-items:center;justify-content:flex-end;padding:6px 12px;border-bottom:1px solid var(--bn-border);flex-shrink:0"
      >
        <div style="display:flex;align-items:center;gap:4px">
          <button
            *ngFor="let opt of viewOpts"
            (click)="setView(opt.v)"
            style="width:24px;height:20px;border-radius:4px;font-size:11px;border:none;cursor:pointer"
            [style.background]="view === opt.v ? 'var(--bn-bg3)' : 'transparent'"
            [style.color]="
              opt.v === 'asks'
                ? 'var(--bn-red)'
                : opt.v === 'bids'
                  ? 'var(--bn-green)'
                  : 'var(--bn-t1)'
            "
          >
            {{ opt.icon }}
          </button>
          <select
            [(ngModel)]="precision"
            class="font-mono-fi"
            style="font-size:11px;border-radius:4px;padding:2px 4px;border:1px solid var(--bn-border2);background:var(--bn-bg2);color:var(--bn-t1)"
          >
            <option *ngFor="let p of precisions">{{ p }}</option>
          </select>
        </div>
      </div>
      <!-- Column headers -->
      <div
        style="display:grid;grid-template-columns:repeat(3,1fr);padding:4px 12px;background:var(--bn-bg2);flex-shrink:0"
      >
        <div style="font-size:11px;color:var(--bn-t1);text-align:left">Price (USD)</div>
        <div style="font-size:11px;color:var(--bn-t1);text-align:right">Amount (MM)</div>
        <div style="font-size:11px;color:var(--bn-t1);text-align:right">Total</div>
      </div>
      <!-- Order book levels -->
      <div style="flex:1;overflow:hidden;display:flex;flex-direction:column">
        <!-- Asks -->
        <div
          *ngIf="view === 'both' || view === 'asks'"
          style="display:flex;flex-direction:column-reverse;overflow-y:auto"
          [style.flex]="view === 'asks' ? '1' : '0 0 auto'"
        >
          <div
            *ngFor="let a of asks; let i = index"
            (click)="onClickPrice(a.price)"
            style="display:grid;grid-template-columns:repeat(3,1fr);padding:2px 12px;cursor:pointer;position:relative"
            class="ob-row-ask"
            [style.--fill-pct]="a.pct + '%'"
          >
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-red)">
              {{ a.price.toFixed(3) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t0);text-align:right">
              {{ a.qty.toFixed(5) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t1);text-align:right">
              {{ a.total.toFixed(5) }}
            </div>
          </div>
        </div>
        <!-- Spread row -->
        <div
          *ngIf="view === 'both'"
          style="display:flex;align-items:center;gap:12px;padding:6px 12px;border-top:1px solid var(--bn-border);border-bottom:1px solid var(--bn-border);background:var(--bn-bg2);flex-shrink:0"
        >
          <span class="font-mono-fi font-bold" style="font-size:13px" [style.color]="spreadColor">{{
            mid.toFixed(3)
          }}</span>
          <span class="font-mono-fi" style="font-size:11px;color:var(--bn-t1)"
            >Spread: {{ spread }} ({{ spreadPct }}%)</span
          >
        </div>
        <!-- Bids -->
        <div *ngIf="view === 'both' || view === 'bids'" style="flex:1;overflow-y:auto">
          <div
            *ngFor="let b of bids; let i = index"
            (click)="onClickPrice(b.price)"
            style="display:grid;grid-template-columns:repeat(3,1fr);padding:2px 12px;cursor:pointer;position:relative"
            class="ob-row-bid"
            [style.--fill-pct]="b.pct + '%'"
          >
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-green)">
              {{ b.price.toFixed(3) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t0);text-align:right">
              {{ b.qty.toFixed(5) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t1);text-align:right">
              {{ b.total.toFixed(5) }}
            </div>
          </div>
        </div>
      </div>
      <!-- Recent trades -->
      <div
        style="border-top:1px solid var(--bn-border);flex-shrink:0;max-height:180px;overflow:hidden;display:flex;flex-direction:column"
      >
        <div
          style="display:grid;grid-template-columns:repeat(3,1fr);padding:4px 12px;background:var(--bn-bg2)"
        >
          <div style="font-size:11px;color:var(--bn-t1);text-align:left">Price (USD)</div>
          <div style="font-size:11px;color:var(--bn-t1);text-align:right">Amount (MM)</div>
          <div style="font-size:11px;color:var(--bn-t1);text-align:right">Time</div>
        </div>
        <div style="overflow-y:auto;flex:1">
          <div
            *ngFor="let t of trades"
            style="display:grid;grid-template-columns:repeat(3,1fr);padding:2px 12px"
          >
            <div
              class="font-mono-fi"
              style="font-size:11px"
              [style.color]="t.side === 'B' ? 'var(--bn-green)' : 'var(--bn-red)'"
            >
              {{ t.price.toFixed(3) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t0);text-align:right">
              {{ t.qty.toFixed(5) }}
            </div>
            <div class="font-mono-fi" style="font-size:11px;color:var(--bn-t1);text-align:right">
              {{ t.time }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OrderBookWidget implements OnInit, OnDestroy {
  @Input() api: any;
  @Input() panel: any;

  private shared = inject(SharedStateService);
  private intervalId: any;

  asks: Level[] = [];
  bids: Level[] = [];
  trades: { price: number; qty: number; side: 'B' | 'S'; time: string }[] = [];
  view: 'both' | 'asks' | 'bids' = 'both';
  precision = '0.01';
  precisions = ['0.001', '0.01', '0.1'];
  viewOpts = [
    { v: 'both', icon: '\u2580\u2584' },
    { v: 'bids', icon: '\u2584' },
    { v: 'asks', icon: '\u2580' },
  ];

  mid = 100;
  spread = 0;
  spreadPct = '0';
  spreadColor = 'var(--bn-green)';

  constructor() {
    effect(() => {
      const bond = this.shared.selectedBond();
      this.mid = (bond.bid + bond.ask) / 2;
      this.generateBook();
    });
  }

  ngOnInit() {
    this.generateBook();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private generateBook() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.asks = genLevels(this.mid, 'ask', 14).reverse();
    this.bids = genLevels(this.mid, 'bid', 14);
    this.updateSpread();

    this.intervalId = setInterval(() => {
      const newMid = this.mid + (Math.random() - 0.5) * 0.04;
      this.asks = genLevels(newMid, 'ask', 14).reverse();
      this.bids = genLevels(newMid, 'bid', 14);
      this.updateSpread();
      const side = Math.random() > 0.5 ? ('B' as const) : ('S' as const);
      const price = +(newMid + (side === 'B' ? 0.012 : -0.012)).toFixed(3);
      const qty = +(Math.random() * 0.3 + 0.001).toFixed(5);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      this.trades = [{ price, qty, side, time }, ...this.trades.slice(0, 24)];
    }, 1000);
  }

  private updateSpread() {
    if (this.asks.length && this.bids.length) {
      this.spread = +(this.asks[this.asks.length - 1].price - this.bids[0].price).toFixed(3);
      this.spreadPct = ((this.spread / this.mid) * 100).toFixed(4);
      this.spreadColor =
        this.bids[0]?.price > this.asks[this.asks.length - 1]?.price
          ? 'var(--bn-red)'
          : 'var(--bn-green)';
    }
  }

  setView(v: string) {
    this.view = v as 'both' | 'asks' | 'bids';
  }

  onClickPrice(price: number) {
    this.shared.clickedPrice.set(price);
  }
}
