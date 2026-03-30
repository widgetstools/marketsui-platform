/**
 * View1Component — sample view with FDC3 context broadcasting.
 * Angular equivalent of the React View1.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view1',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-4 p-4">
      <h1 class="text-lg font-bold">Angular View 1</h1>
      <p class="text-sm text-muted-foreground">
        This is a sample OpenFin view rendered by Angular.
        It demonstrates how an Angular component can run inside an OpenFin view.
      </p>
      <button
        class="px-4 py-2 text-sm font-medium rounded border cursor-pointer
               bg-primary text-primary-foreground hover:opacity-90"
        (click)="broadcastContext()"
      >
        Broadcast FDC3 Context
      </button>
      <p class="text-xs text-muted-foreground">{{ status }}</p>
    </div>
  `,
})
export class View1Component {
  status = '';

  async broadcastContext(): Promise<void> {
    try {
      const fdc3 = (window as any).fdc3;
      if (fdc3) {
        await fdc3.broadcast({
          type: 'fdc3.instrument',
          name: 'Apple',
          id: { ticker: 'AAPL' },
        });
        this.status = 'Context broadcast: AAPL';
      } else {
        this.status = 'FDC3 API not available';
      }
    } catch (err) {
      this.status = 'Broadcast failed';
      console.error(err);
    }
  }
}
