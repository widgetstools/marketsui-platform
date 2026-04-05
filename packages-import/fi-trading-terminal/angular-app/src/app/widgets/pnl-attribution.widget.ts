import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PNL_DATA } from '../services/trading-data.service';

@Component({
  selector: 'pnl-attribution-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="flex:1;display:flex;flex-direction:column;padding:12px 14px;gap:4px">
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px">
          <div *ngFor="let d of data" style="display:flex;align-items:center;gap:8px">
            <span
              style="font-size:9px;color:var(--bn-t1);width:42px;text-align:right;flex-shrink:0"
              >{{ d.attr }}</span
            >
            <div style="flex:1;position:relative;height:18px">
              <div
                style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--bn-bg3)"
              ></div>
              <div
                style="position:absolute;top:2px;height:14px;border-radius:3px;opacity:0.7;transition:width 0.3s ease"
                [style.background]="d.pnl >= 0 ? '#1e90ff' : 'var(--bn-red)'"
                [style.left]="d.pnl >= 0 ? '50%' : 'auto'"
                [style.right]="d.pnl < 0 ? '50%' : 'auto'"
                [style.width.%]="getBarPct(d)"
              ></div>
            </div>
            <span
              class="font-mono-fi font-semibold"
              style="font-size:11px;width:48px;text-align:right;flex-shrink:0"
              [style.color]="d.pnl >= 0 ? '#1e90ff' : 'var(--bn-red)'"
              >{{ fmtPnl(d) }}</span
            >
            <span
              class="font-mono-fi"
              style="font-size:9px;color:var(--bn-t2);width:40px;text-align:right;flex-shrink:0"
              >S{{ d.cum }}</span
            >
          </div>
        </div>
        <div
          style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--bn-border)"
        >
          <span style="font-size:9px;color:var(--bn-t1)">NET P&L MTD</span>
          <span class="font-mono-fi font-bold" style="font-size:18px;color:#1e90ff">+$362K</span>
        </div>
      </div>
    </div>
  `,
})
export class PnlAttributionWidget {
  @Input() api: any;
  @Input() panel: any;
  data = PNL_DATA;
  maxAbs = Math.max(...PNL_DATA.map((d) => Math.abs(d.pnl)));
  getBarPct(d: any): number {
    return (Math.abs(d.pnl) / this.maxAbs) * 50;
  }
  fmtPnl(d: any): string {
    return (d.pnl >= 0 ? '+' : '') + '$' + d.pnl + 'K';
  }
}
