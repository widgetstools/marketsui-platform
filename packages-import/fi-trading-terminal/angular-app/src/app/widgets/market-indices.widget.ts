import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MARKET_INDICES, type MarketIndex } from '../services/trading-data.service';

@Component({
  selector: 'market-indices-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="flex:1;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:var(--bn-bg2);position:sticky;top:0">
              <th
                *ngFor="let h of headers"
                style="font-size:11px;color:var(--bn-t1);padding:5px 10px;border-bottom:1px solid var(--bn-border);font-weight:400;letter-spacing:0.04em"
                [style.textAlign]="h === 'INDEX' ? 'left' : 'right'"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let idx of indices" style="border-bottom:1px solid rgba(43,49,57,0.5)">
              <td
                style="padding:6px 10px;font-size:11px;color:var(--bn-t0);font-family:JetBrains Mono,monospace"
              >
                {{ idx.name }}
              </td>
              <td
                style="padding:6px 10px;font-size:11px;font-family:JetBrains Mono,monospace;color:var(--bn-t0);text-align:right"
              >
                {{ idx.val.toFixed(2) }}
              </td>
              <td
                style="padding:6px 10px;font-size:11px;font-family:JetBrains Mono,monospace;text-align:right"
                [style.color]="idx.chg >= 0 ? 'var(--bn-green)' : 'var(--bn-red)'"
              >
                {{ idx.chg >= 0 ? '+' : '' }}{{ idx.chg.toFixed(2) }}
              </td>
              <td
                style="padding:6px 10px;font-size:11px;font-family:JetBrains Mono,monospace;text-align:right"
                [style.color]="idx.ytd.startsWith('+') ? 'var(--bn-green)' : 'var(--bn-red)'"
              >
                {{ idx.ytd }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class MarketIndicesWidget implements OnInit, OnDestroy {
  @Input() api: any;
  @Input() panel: any;
  headers = ['INDEX', 'LAST', 'CHG', 'YTD'];
  indices: MarketIndex[] = [];
  private tickId: any;

  ngOnInit() {
    this.indices = MARKET_INDICES.map((i) => ({ ...i }));
    this.tickId = setInterval(() => {
      this.indices = this.indices.map((idx) => {
        if (Math.random() < 0.3) {
          const delta = (Math.random() - 0.5) * 0.08;
          return { ...idx, val: +(idx.val + delta).toFixed(2), chg: +(idx.chg + delta).toFixed(2) };
        }
        return idx;
      });
    }, 1800);
  }
  ngOnDestroy() {
    if (this.tickId) clearInterval(this.tickId);
  }
}
