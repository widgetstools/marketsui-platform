/**
 * ImportConfigComponent
 *
 * Angular equivalent of the React ImportConfig component.
 * Hosted in a small OpenFin window at /import-config.
 * Lets the user upload a JSON config exported via "Export Config".
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { saveDockConfig, IAB_RELOAD_AFTER_IMPORT } from '@markets/openfin-workspace';

type ImportStatus = 'idle' | 'success' | 'error';

const isInOpenFin = typeof (window as any).fin !== 'undefined';

@Component({
  selector: 'mkt-import-config',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div
      class="fixed inset-0 flex flex-col items-center justify-center gap-6 p-8"
      style="background: #0D1117; color: #E6EDF3; font-family: system-ui, sans-serif;"
    >
      <!-- Icon -->
      <div
        class="w-14 h-14 rounded-xl flex items-center justify-center"
        style="background: #161B22; border: 1px solid #30363D;"
      >
        <i class="pi pi-upload" style="font-size: 24px; color: #2196F3;"></i>
      </div>

      <!-- Title -->
      <div class="text-center">
        <h1 class="text-lg font-semibold m-0">Import Config</h1>
        <p class="text-sm m-0 mt-1" style="color: #8B949E;">
          Select a previously exported config JSON file
        </p>
      </div>

      <!-- Drop zone -->
      <div
        class="w-full max-w-xs rounded-xl p-5 text-center cursor-pointer transition-all"
        [style.border]="'1.5px dashed ' + (fileName() ? '#2196F3' : '#30363D')"
        [style.background]="fileName() ? 'rgba(33,150,243,0.07)' : '#161B22'"
        (click)="fileInput.click()"
      >
        <span class="text-sm" [style.color]="fileName() ? '#2196F3' : '#8B949E'">
          {{ fileName() ?? 'Click to select a .json file' }}
        </span>
      </div>
      <input
        #fileInput
        type="file"
        accept=".json"
        class="hidden"
        (change)="onFileChange($event)"
      />

      <!-- Status message -->
      <p
        *ngIf="message()"
        class="text-sm text-center m-0"
        [style.color]="status() === 'success' ? '#00E5A0' : '#EF5350'"
      >
        {{ message() }}
      </p>

      <!-- Cancel -->
      <p-button
        label="Cancel"
        severity="secondary"
        (onClick)="close()"
      />
    </div>
  `,
})
export class ImportConfigComponent {
  protected readonly status   = signal<ImportStatus>('idle');
  protected readonly fileName = signal<string | null>(null);
  protected readonly message  = signal('');

  protected async onFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.fileName.set(file.name);
    this.status.set('idle');
    this.message.set('');

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.appConfig || !Array.isArray(importData.appConfig)) {
        this.status.set('error');
        this.message.set('No config data found in this file. Make sure it is a valid config export.');
        return;
      }

      let dockConfigFound = false;
      for (const row of importData.appConfig) {
        if (row.configId === 'dock-config' && row.config) {
          await saveDockConfig(row.config);
          dockConfigFound = true;
        }
      }

      if (!dockConfigFound) {
        this.status.set('error');
        this.message.set('No dock configuration found in this file.');
        return;
      }

      if (isInOpenFin) {
        await (window as any).fin.InterApplicationBus.publish(IAB_RELOAD_AFTER_IMPORT, {});
      }

      this.status.set('success');
      this.message.set('Config imported successfully. The dock has been reloaded.');

      setTimeout(() => this.close(), 1500);
    } catch (err) {
      console.error('ImportConfigComponent: Import failed.', err);
      this.status.set('error');
      this.message.set('Failed to read the file. Make sure it is a valid config export.');
    }
  }

  protected close(): void {
    if (isInOpenFin) {
      (window as any).fin.Window.getCurrentSync().close();
    }
  }
}
