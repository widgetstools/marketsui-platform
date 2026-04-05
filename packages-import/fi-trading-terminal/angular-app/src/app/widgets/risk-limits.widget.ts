import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'risk-limits-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="flex:1;overflow-y:auto">
        <div
          *ngFor="let l of limits"
          style="padding:10px 14px;border-bottom:1px solid rgba(43,49,57,0.5)"
        >
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:11px;color:var(--bn-t1);font-family:JetBrains Mono,monospace">{{
              l.label
            }}</span>
            <span
              style="font-size:11px;font-family:JetBrains Mono,monospace"
              [style.color]="getColor(l)"
              >{{ getPct(l).toFixed(0) }}%</span
            >
          </div>
          <div style="height:5px;border-radius:2px;background:var(--bn-bg2);overflow:hidden">
            <div
              [style.width.%]="getPct(l)"
              [style.background]="getColor(l)"
              style="height:100%;border-radius:2px"
            ></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px">
            <span style="font-size:9px;color:var(--bn-t2);font-family:JetBrains Mono,monospace"
              >{{ l.unit }}{{ l.used.toLocaleString() }}</span
            >
            <span style="font-size:9px;color:var(--bn-t3);font-family:JetBrains Mono,monospace"
              >/ {{ l.unit }}{{ l.limit.toLocaleString() }}</span
            >
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RiskLimitsWidget {
  @Input() api: any;
  @Input() panel: any;
  limits = [
    { label: 'DV01 Limit', used: 18420, limit: 25000, unit: '$' },
    { label: 'VaR 95% 1D', used: 248, limit: 500, unit: '$K' },
    { label: 'IG OAS Dur', used: 4.82, limit: 6.0, unit: 'yr' },
    { label: 'HY Exposure', used: 7.2, limit: 15.0, unit: '$M' },
    { label: 'Single Issuer', used: 10.2, limit: 20.0, unit: '$M' },
  ];
  getPct(l: any) {
    return (l.used / l.limit) * 100;
  }
  getColor(l: any) {
    const pct = this.getPct(l);
    return pct > 85 ? 'var(--bn-red)' : pct > 65 ? '#f0b90b' : 'var(--bn-green)';
  }
}
