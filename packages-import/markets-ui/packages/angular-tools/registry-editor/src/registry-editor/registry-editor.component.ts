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

/* PrimeNG dialog portal — renders outside the [data-dock-editor] container,
   so we style the overlay mask and dialog panel globally to match the theme. */
/* Scoped to .registry-editor-dialog to avoid polluting other PrimeNG dialogs */
.p-dialog-mask:has(.registry-editor-dialog) {
  background: rgba(0, 0, 0, 0.5) !important;
}
.registry-editor-dialog.p-dialog {
  background: #18181c !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 10px !important;
  color: #e8e8ec !important;
  font-family: 'DM Sans', system-ui, sans-serif !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}
.registry-editor-dialog.p-dialog .p-dialog-header {
  background: transparent !important;
  color: #e8e8ec !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  padding: 16px 20px !important;
}
.registry-editor-dialog.p-dialog .p-dialog-header .p-dialog-title {
  font-size: 14px !important;
  font-weight: 600 !important;
}
.registry-editor-dialog.p-dialog .p-dialog-content {
  background: transparent !important;
  color: #e8e8ec !important;
  padding: 16px 20px !important;
}
.registry-editor-dialog.p-dialog .p-dialog-footer {
  background: transparent !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
  padding: 12px 20px !important;
}

/* Light theme dialog — when the editor is in light mode, override dialog colors */
[data-dock-editor][data-theme="light"] ~ .p-dialog-mask .registry-editor-dialog.p-dialog,
body.light-registry-editor .registry-editor-dialog.p-dialog {
  background: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
  color: #1a1a2e !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
}
[data-dock-editor][data-theme="light"] ~ .p-dialog-mask .registry-editor-dialog.p-dialog .p-dialog-header,
body.light-registry-editor .registry-editor-dialog.p-dialog .p-dialog-header {
  color: #1a1a2e !important;
  border-bottom-color: rgba(0, 0, 0, 0.08) !important;
}
[data-dock-editor][data-theme="light"] ~ .p-dialog-mask .registry-editor-dialog.p-dialog .p-dialog-content,
body.light-registry-editor .registry-editor-dialog.p-dialog .p-dialog-content {
  color: #1a1a2e !important;
}
[data-dock-editor][data-theme="light"] ~ .p-dialog-mask .registry-editor-dialog.p-dialog .p-dialog-footer,
body.light-registry-editor .registry-editor-dialog.p-dialog .p-dialog-footer {
  border-top-color: rgba(0, 0, 0, 0.08) !important;
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
  hostUrl: string;
  iconId: string;
  componentType: string;
  componentSubType: string;
  configId: string;
}

const EMPTY_FORM: FormData = {
  displayName: '', hostUrl: '',
  iconId: 'lucide:box', componentType: '', componentSubType: '',
  configId: '',
};

@Component({
  selector: 'mkt-registry-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
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
                @if (entry.configId) {
                  <div [style.font-size]="'10px'" [style.font-family]="'var(--de-mono)'"
                    [style.color]="'var(--de-text-tertiary)'" [style.margin-top]="'2px'">
                    {{ entry.configId }}
                  </div>
                }
              </div>
              <span class="reg-tag" [style.background]="'var(--de-accent-dim)'"
                [style.color]="'var(--de-accent)'">{{ entry.componentType }}</span>
              <span class="reg-tag" [style.background]="'var(--de-bg-surface)'"
                [style.color]="'var(--de-text-secondary)'">{{ entry.componentSubType }}</span>
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
        [style]="{ width: '480px' }" [closable]="true" styleClass="registry-editor-dialog">
        <div [style.display]="'flex'" [style.flex-direction]="'column'" [style.gap]="'14px'"
          [style.padding]="'8px 0'">

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Display Name *</label>
            <input pInputText [(ngModel)]="form.displayName" [style.width]="'100%'" />
          </div>

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Host URL *</label>
            <input pInputText [(ngModel)]="form.hostUrl" placeholder="http://localhost:5174/views/..."
              [style.width]="'100%'" />
          </div>

          <div [style.display]="'grid'" [style.grid-template-columns]="'1fr 1fr'" [style.gap]="'12px'">
            <div>
              <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Component Type *</label>
              <input pInputText [(ngModel)]="form.componentType" placeholder="GRID"
                [style.width]="'100%'" (ngModelChange)="onTypeSubTypeChange()" />
            </div>
            <div>
              <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Component SubType *</label>
              <input pInputText [(ngModel)]="form.componentSubType" placeholder="CREDIT"
                [style.width]="'100%'" (ngModelChange)="onTypeSubTypeChange()" />
            </div>
          </div>

          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Config ID</label>
            <input pInputText [(ngModel)]="form.configId" [style.width]="'100%'"
              [style.font-family]="'var(--de-mono)'" [style.color]="'var(--de-accent)'"
              [style.font-size]="'12px'"
              (ngModelChange)="configIdEdited.set(true)" />
          </div>

          <!-- Icon Picker -->
          <div>
            <label [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">Icon</label>
            <input pInputText [(ngModel)]="iconSearchValue" [style.width]="'100%'"
              placeholder="Search icons..." [style.margin-bottom]="'8px'"
              (ngModelChange)="iconSearch.set($event)" />
            <div [style.max-height]="'160px'" [style.overflow-y]="'auto'"
              [style.display]="'grid'" [style.grid-template-columns]="'repeat(auto-fill, minmax(32px, 1fr))'"
              [style.gap]="'4px'" [style.padding]="'4px'"
              [style.background]="'var(--de-bg-surface)'" [style.border-radius]="'var(--de-radius-sm)'"
              [style.border]="'1px solid var(--de-border)'">
              @for (iconId of filteredIcons(); track iconId) {
                <div (click)="form.iconId = 'mkt:' + iconId"
                  [style.width]="'32px'" [style.height]="'32px'"
                  [style.display]="'flex'" [style.align-items]="'center'" [style.justify-content]="'center'"
                  [style.border-radius]="'4px'" [style.cursor]="'pointer'"
                  [style.border]="form.iconId === 'mkt:' + iconId ? '1px solid var(--de-accent)' : '1px solid transparent'"
                  [style.background]="form.iconId === 'mkt:' + iconId ? 'var(--de-accent-dim)' : 'transparent'"
                  [title]="iconId">
                  <img [src]="getIconUrl('mkt:' + iconId)" width="16" height="16" [alt]="iconId" />
                </div>
              }
            </div>
            @if (form.iconId) {
              <div [style.display]="'flex'" [style.align-items]="'center'" [style.gap]="'8px'"
                [style.margin-top]="'6px'" [style.font-size]="'11px'" [style.color]="'var(--de-text-secondary)'">
                <img [src]="getIconUrl(form.iconId)" width="14" height="14" alt="" />
                {{ form.iconId }}
              </div>
            }
          </div>
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
  iconSearchValue = '';

  readonly configIdEdited = signal(false);
  readonly iconSearch = signal('');
  readonly filteredIcons = computed(() => {
    const q = this.iconSearch().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((name) => {
      const meta = ICON_META[name];
      return name.includes(q) || meta?.name?.toLowerCase().includes(q) || meta?.category?.toLowerCase().includes(q);
    });
  });

  private themeHandler: ((data: { isDark: boolean }) => void) | null = null;
  private destroyed = false;

  ngOnInit(): void {
    injectStyles();
    this.svc.init();
    this.syncTheme();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    // Unsubscribe IAB theme listener
    if (this.themeHandler) {
      try {
        fin.InterApplicationBus.unsubscribe(
          { uuid: fin.me.identity.uuid }, 'theme-changed', this.themeHandler,
        );
      } catch { /* cleanup */ }
    }
    // Remove body class used by PrimeNG dialog portal
    document.body.classList.remove('light-registry-editor');
  }

  private syncTheme(): void {
    if (typeof fin === 'undefined') return;

    // Guard async work against component destruction
    (async () => {
      try {
        const platform = fin.Platform.getCurrentSync();
        const scheme = await platform.Theme.getSelectedScheme();
        if (this.destroyed) return; // Component destroyed while awaiting
        const t = scheme === 'dark' ? 'dark' : 'light';
        this.theme.set(t);
        document.body.classList.toggle('light-registry-editor', t === 'light');
      } catch { /* keep default */ }
    })();

    this.themeHandler = (data: { isDark: boolean }) => {
      const t = data.isDark ? 'dark' : 'light';
      this.theme.set(t);
      document.body.classList.toggle('light-registry-editor', t === 'light');
    };

    try {
      fin.InterApplicationBus.subscribe(
        { uuid: fin.me.identity.uuid }, 'theme-changed', this.themeHandler,
      );
    } catch { /* IAB not ready */ }
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    // Toggle body class so PrimeNG dialog portal (outside component tree)
    // can pick up the light theme via CSS selectors
    document.body.classList.toggle('light-registry-editor', next === 'light');
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

  onTypeSubTypeChange(): void {
    if (!this.configIdEdited()) {
      this.form.configId = this.form.componentType && this.form.componentSubType
        ? generateTemplateConfigId(this.form.componentType.toUpperCase(), this.form.componentSubType.toUpperCase())
        : '';
    }
  }

  openAddDialog(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_FORM };
    this.configIdEdited.set(false);
    this.iconSearch.set('');
    this.iconSearchValue = '';
    this.dialogTitle.set('Add Component');
    this.dialogVisible.set(true);
  }

  openEditDialog(entry: RegistryEntry): void {
    this.editingId.set(entry.id);
    this.form = {
      displayName: entry.displayName,
      hostUrl: entry.hostUrl,
      iconId: entry.iconId,
      componentType: entry.componentType,
      componentSubType: entry.componentSubType,
      configId: entry.configId ?? '',
    };
    this.configIdEdited.set(true);
    this.iconSearch.set('');
    this.iconSearchValue = '';
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
      hostUrl: this.form.hostUrl,
      iconId: this.form.iconId,
      componentType: this.form.componentType.toUpperCase(),
      componentSubType: this.form.componentSubType.toUpperCase(),
      configId: this.form.configId || generateTemplateConfigId(
        this.form.componentType.toUpperCase(),
        this.form.componentSubType.toUpperCase(),
      ),
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
