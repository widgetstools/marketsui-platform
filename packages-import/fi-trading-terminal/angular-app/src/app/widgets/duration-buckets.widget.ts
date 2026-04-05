import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DURATION_BUCKETS, BUCKET_RANGES, BONDS } from '../services/trading-data.service';

function heatBg(value: number, max: number, hex: string): string {
  const intensity = max > 0 ? Math.max(0.06, (value / max) * 0.35) : 0.06;
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${intensity})`;
  }
  return `rgba(30,144,255,${intensity})`;
}

const BUCKET_DETAIL = DURATION_BUCKETS.map((d, i) => {
  const [lo, hi] = BUCKET_RANGES[i];
  const bonds = BONDS.filter(b => b.dur >= lo && b.dur < hi);
  const avgOas = bonds.length ? Math.round(bonds.reduce((a, b) => a + b.oas, 0) / bonds.length) : 0;
  return { ...d, avgOas, bonds };
});
const totalDv01All = BUCKET_DETAIL.reduce((a, d) => a + d.dv01, 0);

@Component({
  selector: 'duration-buckets-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden">
      <div style="flex:1;overflow:auto;padding:6px">
        <table style="width:100%;border-collapse:separate;border-spacing:2px">
          <thead><tr>
            <th style="font-size:9px;color:var(--bn-t2);text-align:left;padding:4px 8px;font-weight:400">Bucket</th>
            <th style="font-size:9px;color:var(--bn-t2);text-align:right;padding:4px 6px;font-weight:400">Bonds</th>
            <th style="font-size:9px;color:var(--bn-t2);text-align:right;padding:4px 6px;font-weight:400">DV01</th>
            <th style="font-size:9px;color:var(--bn-t2);text-align:right;padding:4px 6px;font-weight:400">% Risk</th>
            <th style="font-size:9px;color:var(--bn-t2);text-align:right;padding:4px 6px;font-weight:400">Avg OAS</th>
            <th style="font-size:9px;color:var(--bn-t2);text-align:left;padding:4px 6px;font-weight:400">Distribution</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let d of buckets">
              <td style="padding:6px 8px;border-radius:3px;background:var(--bn-bg2)">
                <span class="font-mono-fi font-semibold" style="font-size:11px;color:var(--bn-t0)">{{d.label}}</span>
              </td>
              <td [style.background]="heatBg(d.count,5,'#c084fc')" style="padding:6px 6px;border-radius:3px;text-align:right">
                <span class="font-mono-fi font-semibold" style="font-size:11px;color:var(--bn-t0)">{{d.count}}</span>
              </td>
              <td [style.background]="heatBg(d.dv01,3000,'#1e90ff')" style="padding:6px 6px;border-radius:3px;text-align:right">
                <span class="font-mono-fi font-semibold" style="font-size:9px;color:var(--bn-t0)">\${{(d.dv01/1000).toFixed(1)}}K</span>
              </td>
              <td [style.background]="heatBg(getRiskPct(d),35,'#1e90ff')" style="padding:6px 6px;border-radius:3px;text-align:right">
                <span class="font-mono-fi" style="font-size:9px;color:var(--bn-t0)">{{getRiskPct(d).toFixed(0)}}%</span>
              </td>
              <td [style.background]="heatBg(d.avgOas,150,'#f0b90b')" style="padding:6px 6px;border-radius:3px;text-align:right">
                <span class="font-mono-fi" style="font-size:9px;color:var(--bn-t0)">{{d.avgOas>0?'+'+d.avgOas+'bp':'---'}}</span>
              </td>
              <td style="padding:6px 6px;border-radius:3px">
                <div style="display:flex;align-items:center;gap:4px">
                  <div style="flex:1;height:6px;border-radius:3px;background:var(--bn-bg3);overflow:hidden">
                    <div [style.width.%]="getRiskPct(d)*2.8" style="height:100%;border-radius:3px;opacity:0.7"
                      [style.background]="d.avgOas>80?'#f0b90b':d.avgOas>30?'#00bcd4':'#1e90ff'"></div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:14px;padding:6px 14px;border-top:1px solid var(--bn-border);flex-shrink:0">
        <div *ngFor="let s of summary" style="display:flex;align-items:center;gap:4px">
          <span style="font-size:9px;color:var(--bn-t2)">{{s.l}}</span>
          <span class="font-mono-fi font-semibold" style="font-size:11px" [style.color]="s.c">{{s.v}}</span>
        </div>
      </div>
    </div>
  `,
})
export class DurationBucketsWidget {
  @Input() api: any;
  @Input() panel: any;
  buckets = BUCKET_DETAIL;
  totalDv01 = totalDv01All;
  summary = [
    { l: 'Total DV01', v: `$${(totalDv01All / 1000).toFixed(1)}K`, c: '#1e90ff' },
    { l: 'Avg Dur', v: '4.82yr', c: '#00bcd4' },
    { l: 'Bonds', v: String(BUCKET_DETAIL.reduce((a, d) => a + d.count, 0)), c: 'var(--bn-t0)' },
    { l: 'Wt Avg OAS', v: `+${Math.round(BUCKET_DETAIL.reduce((a, d) => a + d.avgOas * d.count, 0) / BUCKET_DETAIL.reduce((a, d) => a + d.count, 0))}bp`, c: '#f0b90b' },
  ];

  getRiskPct(d: any) { return this.totalDv01 > 0 ? (d.dv01 / this.totalDv01) * 100 : 0; }
  heatBg = heatBg;
}
