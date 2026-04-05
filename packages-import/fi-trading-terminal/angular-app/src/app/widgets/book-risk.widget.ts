import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RISK_POSITIONS, BONDS } from '../services/trading-data.service';

const HEAT_COLORS = ['#1e90ff','#00bcd4','#f0b90b','#f59e0b','var(--bn-red)','#dc2626'];
const heatLevel = (oas:number) => oas<20?0:oas<50?1:oas<100?2:oas<150?3:oas<250?4:5;

@Component({
  selector: 'book-risk-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden">
      <div style="flex:1;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--bn-bg2);position:sticky;top:0">
            <th *ngFor="let h of headers" style="font-size:11px;color:var(--bn-t1);padding:5px 10px;border-bottom:1px solid var(--bn-border);font-weight:400;letter-spacing:0.04em"
              [style.textAlign]="h==='BOOK'?'left':'right'">{{h}}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of positions" style="border-bottom:1px solid rgba(43,49,57,0.5)">
              <td style="padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:#00bcd4">{{p.book}}</td>
              <td style="padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:var(--bn-t0);text-align:right">{{p.mv}}</td>
              <td style="padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:11px;color:#1e90ff;text-align:right">{{p.dv01.toLocaleString()}}</td>
              <td style="padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:11px;text-align:right"
                [style.color]="p.oas>100?'#f0b90b':'var(--bn-green)'">{{p.oas>0?'+'+p.oas:p.oas}}</td>
              <td style="padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:11px;text-align:right"
                [style.color]="p.pnl>=0?'var(--bn-green)':'var(--bn-red)'">{{p.pnl>=0?'+':''}}{{p.pnl}}K</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- OAS heatmap -->
      <div style="border-top:1px solid var(--bn-border);flex-shrink:0">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px">
          <div *ngFor="let b of heatBonds" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:3px;padding:5px 2px"
            [style.background]="getHeatBg(b.oas)" [style.border]="'1px solid '+getHeatBorder(b.oas)">
            <div style="font-size:9px;font-weight:700;font-family:JetBrains Mono,monospace" [style.color]="getHeatColor(b.oas)">{{b.ticker}}</div>
            <div style="font-size:9px;color:var(--bn-t2);font-family:JetBrains Mono,monospace">{{b.oas>0?'+'+b.oas:b.oas}}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BookRiskWidget {
  @Input() api: any;
  @Input() panel: any;
  headers = ['BOOK','MV','DV01','OAS','P&L'];
  positions = RISK_POSITIONS;
  heatBonds = BONDS.slice(0, 16);

  getHeatColor(oas: number) { return HEAT_COLORS[heatLevel(oas)]; }
  getHeatBg(oas: number) { return HEAT_COLORS[heatLevel(oas)] + '1a'; }
  getHeatBorder(oas: number) { return HEAT_COLORS[heatLevel(oas)] + '30'; }
}
