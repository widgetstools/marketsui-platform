/* eslint-disable @typescript-eslint/no-explicit-any */
declare const fin: any;

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistryEditorService } from './registry-editor.service';
import { generateTemplateConfigId, type RegistryEntry } from '@markets/openfin-workspace';
import { ICON_NAMES, ICON_META } from '@markets/icons-svg';
import { iconIdToSvgUrl } from '@markets/angular-dock-editor';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

/** Inject the shared --de-* design system CSS at runtime. */
const EDITOR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
[data-dock-editor] {
  --de-font: 'DM Sans', system-ui, sans-serif;
  --de-mono: 'JetBrains Mono', monospace;
  --de-bg-deep: #0c0c0e; --de-bg: #111114; --de-bg-raised: #18181c;
  --de-bg-surface: #1e1e24; --de-bg-hover: #252530; --de-bg-active: #2a2a38;
  --de-border: rgba(255,255,255,0.06); --de-border-subtle: rgba(255,255,255,0.04);
  --de-border-strong: rgba(255,255,255,0.10);
  --de-text: #e8e8ec; --de-text-secondary: #8b8b9e;
  --de-text-tertiary: #5c5c6e; --de-text-ghost: #3a3a4a;
  --de-accent: #e8a849; --de-accent-dim: rgba(232,168,73,0.12);
  --de-accent-subtle: rgba(232,168,73,0.06);
  --de-danger: #e5534b; --de-danger-dim: rgba(229,83,75,0.12);
  --de-success: #3fb950;
  --de-shadow-sm: 0 1px 2px rgba(0,0,0,0.3); --de-shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --de-shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
  --de-radius-sm: 6px; --de-radius-md: 10px; --de-radius-lg: 14px;
  font-family: var(--de-font); color: var(--de-text);
  -webkit-font-smoothing: antialiased;
}
[data-dock-editor][data-theme="light"] {
  --de-bg-deep: #f5f5f7; --de-bg: #fafafa; --de-bg-raised: #ffffff;
  --de-bg-surface: #f0f0f3; --de-bg-hover: #e8e8ec; --de-bg-active: #dddde3;
  --de-border: rgba(0,0,0,0.08); --de-border-subtle: rgba(0,0,0,0.04);
  --de-border-strong: rgba(0,0,0,0.12);
  --de-text: #1a1a2e; --de-text-secondary: #5c5c72;
  --de-text-tertiary: #8e8ea0; --de-text-ghost: #b8b8c8;
  --de-accent: #c4882e; --de-accent-dim: rgba(196,136,46,0.10);
  --de-shadow-sm: 0 1px 2px rgba(0,0,0,0.06); --de-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --de-shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}
`;

let cssInjected = false;
function injectStyles(): void {
  if (cssInjected) return;
  const style = document.createElement('style');
  style.setAttribute('data-registry-editor-styles', '');
  style.textContent = EDITOR_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

interface FormData {
  displayName: string;
  framework: 'react' | 'angular';
  hostUrl: string;
  iconId: string;
  componentType: string;
  componentSubType: string;
  isTemplate: boolean;
}

const EMPTY_FORM: FormData = {
  displayName: '', framework: 'react', hostUrl: '',
  iconId: 'lucide:box', componentType: '', componentSubType: '',
  isTemplate: true,
};

@Component({
  selector: 'mkt-registry-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
    SelectModule, ToggleSwitchModule,
  ],
  providers: [RegistryEditorService],
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .reg-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: var(--de-radius-sm); transition: background 0.15s ease; cursor: default; }
    .reg-row:hover { background: var(--de-bg-hover); }
    .reg-row:hover .reg-actions { opacity: 1; }
    .reg-actions { opacity: 0; transition: opacity 0.15s ease; display: flex; gap: 4px; }
    .reg-icon-box { width: 28px; height: 28px; border-radius: var(--de-radius-sm);
      background: var(--de-bg-surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .reg-name { font-size: 13px; font-weight: 500; color: var(--de-text); line-height: 1.3; }
    .reg-url { font-size: 11px; color: var(--de-text-tertiary); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; }
    .reg-tag { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.04em; }
    .fw-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
      border-radius: 4px; font-size: 11px; font-weight: 500; }
    .fw-react { background: rgba(97,218,251,0.15); color: #61dafb; }
    .fw-angular { background: rgba(221,0,49,0.15); color: #dd0031; }
    .action-btn { background: var(--de-bg-surface); border: 1px solid var(--de-border);
      border-radius: var(--de-radius-sm); padding: 4px; cursor: pointer;
      color: var(--de-text-secondary); display: flex; align-items: center; justify-content: center; }
    .action-btn:hover { background: var(--de-bg-hover); }
    .action-btn.danger { color: var(--de-danger); }
  `],
  template: `
    <div data-dock-editor [attr.data-theme]="theme()"
      [style.position]="'fixed'" [style.inset]="'0'"
      [style.display]="'flex'" [style.flex-direction]="'column'"
      [style.background]="'var(--de-bg-deep)'" [style.overflow]="'hidden'"
      [style.font-family]="'var(--de-font)'">

      <!-- Header -->
      <div [style.display]="'flex'" [style.align-items]="'center'" [style.gap]="'12px'"
        [style.padding]="'16px 20px'" [style.border-bottom]="'1px solid var(--de-border)'"
        [style.background]="'var(--de-bg)'">
        <span [style.font-size]="'15px'" [style.font-weight]="'600'" [style.color]="'var(--de-text)'">
          Component Registry
        </span>
        <span [style.font-size]="'11px'" [style.font-weight]="'500'" [style.padding]="'2px 8px'"
          [style.border-radius]="'10px'" [style.background]="'var(--de-accent-dim)'"
          [style.color]="'var(--de-accent)'">
          {{ svc.entryCount() }} {{ svc.entryCount() === 1 ? 'component' : 'components' }}
        </span>
        <div [style.flex]="'1'"></div>
        <button class="action-btn" (click)="toggleTheme()" title="Toggle theme">
          {{ theme() === 'dark' ? '☀' : '🌙' }}
        </button>
        <button pButton [disabled]="!svc.isDirty()" (click)="svc.save()" label="Save"
          [style.font-size]="'12px'" [style.padding]="'6px 16px'"
          [severity]="svc.isDirty() ? 'warn' : 'secondary'" size="small"></button>
      </div>

      <!-- Body -->
      <div [style.flex]="'1'" [style.overflow]="'auto'" [style.padding]="'12px 16px'">
        @if (svc.isLoading()) {
          <div [style.text-align]="'center'" [style.padding]="'40px'"
            [style.color]="'var(--de-text-secondary)'">Loading...</div>
        } @else if (svc.entryCount() === 0) {
          <div [style.display]="'flex'" [style.flex-direction]="'column'" [style.align-items]="'center'"
            [style.justify-content]="'center'" [style.height]="'100%'" [style.gap]="'12px'">
            <div [style.font-size]="'13px'" [style.color]="'var(--de-text-tertiary)'">
              No components registered yet
            </div>
            <button pButton (click)="openAddDialog()" label="Add Component" severity="warn" size="small"></button>
          </div>
        } @else {
          @for (entry of svc.entries(); track entry.id) {
            <div class="reg-row">
              <div class="reg-icon-box">
                <img [src]="getIconUrl(entry.iconId)" width="14" height="14" alt="" />
              </div>
              <div [style.flex]="'1'" [style.min-width]="'0'">
                <div class="reg-name">{{ entry.displayName }}</div>
                <div class="reg-url">{{ entry.hostUrl }}</div>
              </div>
              <span class="fw-badge" [class.fw-react]="entry.framework === 'react'"
                [class.fw-angular]="entry.framework === 'angular'">
                {{ entry.framework === 'react' ? 'React' : 'Angular' }}
              </span>
              <span class="reg-tag" [style.background]="'var(--de-accent-dim)'"
                [style.color]="'var(--de-accent)'">{{ entry.componentType }}</span>
              <span class="reg-tag" [style.background]="'var(--de-bg-surface)'"
                [style.color]="'var(--de-text-secondary)'">{{ entry.componentSubType }}</span>
              @if (entry.isTemplate) {
                <span class="reg-tag" [style.background]="'rgba(63,185,80,0.12)'"
                  [style.color]="'#3fb950'">TPL</span>
              }
              <div class="reg-actions">
                <button class="action-btn" (click)="openEditDialog(entry)" title="Edit">✎</button>
                <button class="action-btn" (click)="svc.testComponent(entry)" title="Test">▶</button>
                <button class="action-btn danger" (click)="svc.removeEntry(entry.id)" title="Delete">✕</button>
              </div>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      @if (svc.entryCount() > 0) {
        <div [style.padding]="'12px 20px'" [style.border-top]="'1px solid var(--de-border)'"
          [style.background]="'var(--de-bg)'" [style.display]="'flex'" [style.justify-content]="'center'">
          <button pButton (click)="openAddDialog()" label="Add Component" icon="pi pi-plus"
            severity="secondary" size="small"></button>
        </div>
      }

      <!-- Dialog -->
      <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [header]="dialogTitle()" [modal]="true"
        [style]="{ width: '480px' }" [closable]="true">
        <div [style.display]="'flex'" [style.flex-direction]="'column'" [style.gap]="'14px'"
          [style.padding]="'8px 0'">

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Display Name *</label>
            <input pInputText [(ngModel)]="form.displayName" [style.width]="'100%'" />
          </div>

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Framework</label>
            <p-select [(ngModel)]="form.framework" [options]="frameworkOptions"
              optionLabel="label" optionValue="value" [style.width]="'100%'" />
          </div>

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Host URL *</label>
            <input pInputText [(ngModel)]="form.hostUrl" placeholder="http://localhost:5174/views/..."
              [style.width]="'100%'" />
          </div>

          <div [style.display]="'grid'" [style.grid-template-columns]="'1fr 1fr'" [style.gap]="'12px'">
            <div>
              <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Component Type *</label>
              <input pInputText [(ngModel)]="form.componentType" placeholder="GRID" [style.width]="'100%'" />
            </div>
            <div>
              <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Component SubType *</label>
              <input pInputText [(ngModel)]="form.componentSubType" placeholder="CREDIT" [style.width]="'100%'" />
            </div>
          </div>

          <div [style.display]="'flex'" [style.align-items]="'center'" [style.justify-content]="'space-between'">
            <div>
              <div [style.font-size]="'12px'" [style.font-weight]="'500'">Template Component</div>
              <div [style.font-size]="'11px'" [style.color]="'var(--de-text-tertiary)'">
                Creates a template config in APP_CONFIG
              </div>
            </div>
            <p-toggleswitch [(ngModel)]="form.isTemplate" />
          </div>

          @if (form.isTemplate && form.componentType && form.componentSubType) {
            <div [style.padding]="'8px 12px'" [style.background]="'var(--de-bg-surface)'"
              [style.border-radius]="'var(--de-radius-sm)'" [style.border]="'1px solid var(--de-border)'">
              <div [style.font-size]="'10px'" [style.color]="'var(--de-text-tertiary)'">Generated Config ID</div>
              <div [style.font-size]="'12px'" [style.font-family]="'var(--de-mono)'"
                [style.color]="'var(--de-accent)'">
                {{ getGeneratedId() }}
              </div>
            </div>
          }
        </div>

        <ng-template #footer>
          <button pButton (click)="dialogVisible.set(false)" label="Cancel" severity="secondary" size="small"></button>
          <button pButton (click)="handleSave()" label="Save" severity="warn" size="small"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class RegistryEditorComponent implements OnInit, OnDestroy {
  readonly svc = inject(RegistryEditorService);
  readonly theme = signal<'dark' | 'light'>('dark');

  readonly dialogVisible = signal(false);
  readonly dialogTitle = signal('Add Component');
  readonly editingId = signal<string | null>(null);

  form: FormData = { ...EMPTY_FORM };

  readonly frameworkOptions = [
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
  ];

  private themeHandler: ((data: { isDark: boolean }) => void) | null = null;

  ngOnInit(): void {
    injectStyles();
    this.svc.init();
    this.syncTheme();
  }

  ngOnDestroy(): void {
    if (this.themeHandler) {
      try {
        fin.InterApplicationBus.unsubscribe(
          { uuid: fin.me.identity.uuid }, 'theme-changed', this.themeHandler,
        );
      } catch { /* cleanup */ }
    }
  }

  private syncTheme(): void {
    if (typeof fin === 'undefined') return;

    (async () => {
      try {
        const platform = fin.Platform.getCurrentSync();
        const scheme = await platform.Theme.getSelectedScheme();
        this.theme.set(scheme === 'dark' ? 'dark' : 'light');
      } catch { /* keep default */ }
    })();

    this.themeHandler = (data: { isDark: boolean }) => {
      this.theme.set(data.isDark ? 'dark' : 'light');
    };

    try {
      fin.InterApplicationBus.subscribe(
        { uuid: fin.me.identity.uuid }, 'theme-changed', this.themeHandler,
      );
    } catch { /* IAB not ready */ }
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  getIconUrl(iconId: string): string {
    const [prefix, name] = iconId.split(':');
    if (prefix === 'mkt' && name) {
      return iconIdToSvgUrl(iconId, this.theme() === 'dark' ? '#e8a849' : '#c4882e');
    }
    return `https://api.iconify.design/${iconId.replace(':', '/')}.svg?color=${
      encodeURIComponent(this.theme() === 'dark' ? '#e8a849' : '#c4882e')
    }`;
  }

  getGeneratedId(): string {
    return generateTemplateConfigId(
      this.form.componentType.toUpperCase(),
      this.form.componentSubType.toUpperCase(),
    );
  }

  openAddDialog(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_FORM };
    this.dialogTitle.set('Add Component');
    this.dialogVisible.set(true);
  }

  openEditDialog(entry: RegistryEntry): void {
    this.editingId.set(entry.id);
    this.form = {
      displayName: entry.displayName,
      framework: entry.framework,
      hostUrl: entry.hostUrl,
      iconId: entry.iconId,
      componentType: entry.componentType,
      componentSubType: entry.componentSubType,
      isTemplate: entry.isTemplate,
    };
    this.dialogTitle.set('Edit Component');
    this.dialogVisible.set(true);
  }

  handleSave(): void {
    if (!this.form.displayName || !this.form.hostUrl || !this.form.componentType || !this.form.componentSubType) {
      return;
    }

    const currentEditingId = this.editingId();

    const entry: RegistryEntry = {
      id: currentEditingId ?? crypto.randomUUID(),
      displayName: this.form.displayName,
      framework: this.form.framework,
      hostUrl: this.form.hostUrl,
      iconId: this.form.iconId,
      componentType: this.form.componentType.toUpperCase(),
      componentSubType: this.form.componentSubType.toUpperCase(),
      isTemplate: this.form.isTemplate,
      createdAt: currentEditingId
        ? (this.svc.entries().find((e) => e.id === currentEditingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    if (currentEditingId) {
      this.svc.updateEntry(currentEditingId, entry);
    } else {
      this.svc.addEntry(entry);
    }

    this.dialogVisible.set(false);
  }
}
