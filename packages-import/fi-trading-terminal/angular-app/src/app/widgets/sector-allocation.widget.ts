import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BONDS, SECTOR_ALLOC, SECTOR_COLORS } from '../services/trading-data.service';

function heatBg(value: number, max: number, hex: string): string {
  const intensity = max > 0 ? Math.max(0.06, (value / max) * 0.35) : 0.06;
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${intensity})`;
  }
  return `rgba(30,144,255,${intensity})`;
}

const SECTOR_HEATMAP = SECTOR_ALLOC.map((s) => {
  const bond = BONDS.filter((b) => b.sector === s.sector);
  const avgOas = bond.length ? Math.round(bond.reduce((a, b) => a + b.oas, 0) / bond.length) : 0;
  const totalDv01 = bond.reduce((a, b) => a + b.dv01, 0);
  const avgDur = bond.length ? +(bond.reduce((a, b) => a + b.dur, 0) / bond.length).toFixed(1) : 0;
  return { ...s, avgOas, totalDv01, avgDur };
});

const COLS = [
  { key: 'pct', label: 'Weight', fmt: (v: number) => `${v}%`, color: '#1e90ff' },
  { key: 'mv', label: 'MV ($M)', fmt: (v: number) => `$${v}`, color: '#00bcd4' },
  { key: 'bonds', label: 'Bonds', fmt: (v: number) => String(v), color: '#c084fc' },
  {
    key: 'totalDv01',
    label: 'DV01',
    fmt: (v: number) => `$${(v / 1000).toFixed(1)}K`,
    color: '#1e90ff',
  },
  { key: 'avgOas', label: 'Avg OAS', fmt: (v: number) => `+${v}bp`, color: '#f0b90b' },
  { key: 'avgDur', label: 'Avg Dur', fmt: (v: number) => `${v}yr`, color: '#00bcd4' },
];
const colMaxes: Record<string, number> = {};
COLS.forEach((c) => {
  colMaxes[c.key] = Math.max(...SECTOR_HEATMAP.map((s) => (s as any)[c.key] as number));
});

@Component({
  selector: 'sector-allocation-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="flex:1;overflow:auto;padding:6px">
        <table style="width:100%;border-collapse:separate;border-spacing:2px">
          <thead>
            <tr>
              <th
                style="font-size:9px;color:var(--bn-t2);text-align:left;padding:4px 8px;font-weight:400"
              >
                Sector
              </th>
              <th
                *ngFor="let c of cols"
                style="font-size:9px;color:var(--bn-t2);text-align:right;padding:4px 6px;font-weight:400;white-space:nowrap"
              >
                {{ c.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sectors; let i = index">
              <td style="padding:5px 8px;border-radius:3px">
                <div style="display:flex;align-items:center;gap:5px">
                  <div
                    [style.background]="sectorColors[i]"
                    style="width:3px;height:16px;border-radius:2px;flex-shrink:0"
                  ></div>
                  <span style="font-size:9px;color:var(--bn-t0);white-space:nowrap">{{
                    s.sector
                  }}</span>
                </div>
              </td>
              <td
                *ngFor="let c of cols"
                [style.background]="getHeatBg(getVal(s, c.key), c.key, c.color)"
                style="padding:5px 6px;border-radius:3px;text-align:right"
              >
                <span class="font-mono-fi font-semibold" style="font-size:9px;color:var(--bn-t0)">{{
                  c.fmt(getVal(s, c.key))
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SectorAllocationWidget {
  @Input() api: any;
  @Input() panel: any;
  sectors = SECTOR_HEATMAP;
  cols = COLS;
  sectorColors = SECTOR_COLORS;
  getVal(s: any, key: string): number {
    return s[key] as number;
  }
  getHeatBg(value: number, key: string, color: string): string {
    return heatBg(value, colMaxes[key], color);
  }
}
