import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BONDS } from '../services/trading-data.service';

const SCATTER_DATA = BONDS.map((b) => ({
  name: b.ticker,
  x: b.dur,
  y: b.oas,
  dv01: b.dv01,
  rtg: b.rtgClass,
}));
const RTG_COLOR: Record<string, string> = {
  aaa: '#1e90ff',
  aa: '#00bcd4',
  a: '#2dd4bf',
  bbb: '#f0b90b',
  hy: '#f87171',
};

@Component({
  selector: 'oas-duration-widget',
  standalone: true,
  imports: [CommonModule],
  host: { style: 'display:flex;flex-direction:column;height:100%;width:100%' },
  template: `
    <div style="flex:1;position:relative;background:var(--bn-bg1)">
      <canvas #canvas style="width:100%;height:100%;display:block"></canvas>
    </div>
    <div style="display:flex;gap:10px;padding:4px 14px 8px;flex-shrink:0;background:var(--bn-bg1)">
      <div *ngFor="let item of legend" style="display:flex;align-items:center;gap:4px">
        <div [style.background]="item.color" style="width:7px;height:7px;border-radius:50%"></div>
        <span style="font-size:9px;color:var(--bn-t2);font-family:JetBrains Mono,monospace">{{
          item.label
        }}</span>
      </div>
    </div>
  `,
})
export class OasDurationWidget implements AfterViewInit, OnDestroy {
  @Input() api: any;
  @Input() panel: any;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private obs?: ResizeObserver;
  legend = Object.entries(RTG_COLOR).map(([r, c]) => ({ label: r.toUpperCase(), color: c }));

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

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
      H = canvas.height;
    const pad = { l: 40, r: 20, t: 16, b: 28 };
    ctx.clearRect(0, 0, W, H);
    const g = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    ctx.fillStyle = g('--bn-bg1');
    ctx.fillRect(0, 0, W, H);

    const maxX = Math.max(...SCATTER_DATA.map((d) => d.x)) * 1.1;
    const maxY = Math.max(...SCATTER_DATA.map((d) => d.y)) * 1.1;
    const xOf = (v: number) => pad.l + (v / maxX) * (W - pad.l - pad.r);
    const yOf = (v: number) => pad.t + (1 - v / maxY) * (H - pad.t - pad.b);

    // Grid
    ctx.strokeStyle = g('--bn-bg2');
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      const y = pad.t + ((H - pad.t - pad.b) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = g('--bn-t2');
      ctx.font = '9px JetBrains Mono,monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`+${Math.round(maxY * (1 - i / 5))}`, pad.l - 4, y + 3);
    }
    // X axis label
    ctx.fillStyle = g('--bn-t2');
    ctx.font = '9px JetBrains Mono,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Duration (yrs)', W / 2, H - 4);

    // Dots
    SCATTER_DATA.forEach((d) => {
      const r = Math.min(5 + d.dv01 / 300, 10);
      const color = RTG_COLOR[d.rtg] || '#888';
      ctx.beginPath();
      ctx.arc(xOf(d.x), yOf(d.y), r, 0, Math.PI * 2);
      ctx.fillStyle = color + 'bf';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}
