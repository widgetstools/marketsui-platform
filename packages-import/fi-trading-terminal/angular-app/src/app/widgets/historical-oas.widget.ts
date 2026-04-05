import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HIST_OAS } from '../services/trading-data.service';

@Component({
  selector: 'historical-oas-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div
      style="display:flex;flex-direction:column;height:100%;background:var(--bn-bg1);overflow:hidden"
    >
      <div style="display:flex;justify-content:flex-end;padding:4px 10px;flex-shrink:0">
        <button
          *ngFor="let p of periods"
          (click)="period = p; draw()"
          class="font-mono-fi"
          style="font-size:9px;padding:2px 6px;margin-left:3px;border-radius:2px;cursor:pointer"
          [style.background]="period === p ? 'var(--bn-border)' : 'transparent'"
          [style.border]="'1px solid var(--bn-border)'"
          [style.color]="period === p ? 'var(--bn-t0)' : 'var(--bn-t1)'"
        >
          {{ p }}
        </button>
      </div>
      <div style="flex:1;position:relative">
        <canvas #canvas style="width:100%;height:100%;display:block"></canvas>
      </div>
    </div>
  `,
})
export class HistoricalOasWidget implements AfterViewInit, OnDestroy {
  @Input() api: any;
  @Input() panel: any;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private obs?: ResizeObserver;
  periods = ['1M', '3M', '6M', '1Y'];
  period = '3M';

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this.draw();
    });
    this.obs.observe(canvas.parentElement!);
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 200;
    this.draw();
  }
  ngOnDestroy() {
    this.obs?.disconnect();
  }

  draw() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
      H = canvas.height;
    const pad = { l: 36, r: 40, t: 8, b: 20 };
    ctx.clearRect(0, 0, W, H);
    const g = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    ctx.fillStyle = g('--bn-bg1');
    ctx.fillRect(0, 0, W, H);

    const data = HIST_OAS;
    const n = data.length;
    const igVals = data.map((d) => d.ig),
      hyVals = data.map((d) => d.hy);
    const minIg = Math.min(...igVals) * 0.98,
      maxIg = Math.max(...igVals) * 1.02;
    const minHy = Math.min(...hyVals) * 0.98,
      maxHy = Math.max(...hyVals) * 1.02;

    const xOf = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
    const yIg = (v: number) => pad.t + (1 - (v - minIg) / (maxIg - minIg)) * (H - pad.t - pad.b);
    const yHy = (v: number) => pad.t + (1 - (v - minHy) / (maxHy - minHy)) * (H - pad.t - pad.b);

    // Grid
    ctx.strokeStyle = g('--bn-bg2');
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 3; i++) {
      const y = pad.t + ((H - pad.t - pad.b) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }

    // IG area
    const igGrad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    igGrad.addColorStop(0, 'rgba(30,144,255,0.15)');
    igGrad.addColorStop(1, 'rgba(30,144,255,0)');
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(xOf(i), yIg(d.ig)) : ctx.lineTo(xOf(i), yIg(d.ig));
    });
    ctx.lineTo(xOf(n - 1), H - pad.b);
    ctx.lineTo(pad.l, H - pad.b);
    ctx.closePath();
    ctx.fillStyle = igGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = '#1e90ff';
    ctx.lineWidth = 1.5;
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(xOf(i), yIg(d.ig)) : ctx.lineTo(xOf(i), yIg(d.ig));
    });
    ctx.stroke();

    // HY area
    const hyGrad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    hyGrad.addColorStop(0, 'rgba(248,113,113,0.1)');
    hyGrad.addColorStop(1, 'rgba(248,113,113,0)');
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(xOf(i), yHy(d.hy)) : ctx.lineTo(xOf(i), yHy(d.hy));
    });
    ctx.lineTo(xOf(n - 1), H - pad.b);
    ctx.lineTo(pad.l, H - pad.b);
    ctx.closePath();
    ctx.fillStyle = hyGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = g('--bn-red');
    ctx.lineWidth = 1.5;
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(xOf(i), yHy(d.hy)) : ctx.lineTo(xOf(i), yHy(d.hy));
    });
    ctx.stroke();

    // Legend
    ctx.textAlign = 'left';
    [
      ['CDX IG', '#1e90ff'],
      ['CDX HY', g('--bn-red')],
    ].forEach(([label, color], idx) => {
      ctx.fillStyle = color as string;
      ctx.fillRect(pad.l + idx * 70, 2, 12, 3);
      ctx.fillStyle = g('--bn-t2');
      ctx.font = '8px JetBrains Mono,monospace';
      ctx.fillText(label as string, pad.l + idx * 70 + 16, 6);
    });
  }
}
