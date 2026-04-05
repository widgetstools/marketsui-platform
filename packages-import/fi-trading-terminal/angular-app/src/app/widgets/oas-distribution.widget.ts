import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAS_DATA } from '../services/trading-data.service';

@Component({
  selector: 'oas-distribution-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden">
      <div style="flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;gap:2px">
        <div *ngFor="let d of data" style="display:flex;align-items:center;gap:6px;padding:3px 0">
          <span class="font-mono-fi" style="font-size:9px;color:var(--bn-t1);width:72px;text-align:right;flex-shrink:0">{{d.name}}</span>
          <div style="flex:1;position:relative;height:14px">
            <div style="position:absolute;top:6px;left:0;right:0;height:2px;background:var(--bn-bg3);border-radius:1px"></div>
            <div [style.width.%]="getPct(d)" style="position:absolute;top:6px;left:0;height:2px;border-radius:1px;transition:width 0.3s ease" [style.background]="d.color"></div>
            <div [style.left.%]="getPct(d)" style="position:absolute;top:3px;width:8px;height:8px;border-radius:50%;border:2px solid var(--bn-bg1);transform:translateX(-4px);transition:left 0.3s ease" [style.background]="d.color"></div>
          </div>
          <span class="font-mono-fi font-semibold" style="font-size:9px;width:40px;text-align:right;flex-shrink:0" [style.color]="d.color">+{{d.oas}}bp</span>
        </div>
      </div>
    </div>
  `,
})
export class OasDistributionWidget {
  @Input() api: any;
  @Input() panel: any;
  data = OAS_DATA;
  maxOas = Math.max(...OAS_DATA.map(d => d.oas));
  getPct(d: any): number { return this.maxOas > 0 ? (d.oas / this.maxOas) * 100 : 0; }
}
