import { Component, ChangeDetectionStrategy, signal, DOCUMENT, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/* PrimeNG */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';

/* ── Types ── */
interface TeamMember { name: string; email: string; initials: string; role: string; }
interface Sale { name: string; email: string; initials: string; amount: string; }
interface ShareUser { name: string; email: string; initials: string; permission: string; }
interface Notification { key: string; title: string; description: string; enabled: boolean; }
interface Option { label: string; value: string; }

/* ── Data — identical to React ── */
const TEAM: TeamMember[] = [
  { name: 'Sofia Davis', email: 'sofia@example.com', initials: 'SD', role: 'Owner' },
  { name: 'Jackson Lee', email: 'jackson@example.com', initials: 'JL', role: 'Member' },
  { name: 'Isabella Nguyen', email: 'isabella@example.com', initials: 'IN', role: 'Member' },
  { name: 'William Kim', email: 'william@example.com', initials: 'WK', role: 'Viewer' },
];

const SALES: Sale[] = [
  { name: 'Olivia Martin', email: 'olivia.martin@email.com', initials: 'OM', amount: '+$1,999.00' },
  { name: 'Jackson Lee', email: 'jackson.lee@email.com', initials: 'JL', amount: '+$39.00' },
  { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', initials: 'IN', amount: '+$299.00' },
  { name: 'William Kim', email: 'will@email.com', initials: 'WK', amount: '+$99.00' },
  { name: 'Sofia Davis', email: 'sofia.davis@email.com', initials: 'SD', amount: '+$1,499.00' },
];

const SHARE_USERS: ShareUser[] = [
  { name: 'Olivia Martin', email: 'm@example.com', initials: 'OM', permission: 'edit' },
  { name: 'Isabella Nguyen', email: 'b@example.com', initials: 'IN', permission: 'view' },
  { name: 'Sofia Davis', email: 'p@example.com', initials: 'SD', permission: 'view' },
];

const NOTIFICATIONS: Notification[] = [
  { key: 'comms', title: 'Communication emails', description: 'Receive emails about your account activity.', enabled: true },
  { key: 'marketing', title: 'Marketing emails', description: 'Receive emails about new products, features, and more.', enabled: false },
  { key: 'social', title: 'Social emails', description: 'Receive emails for friend requests, follows, and more.', enabled: true },
  { key: 'security', title: 'Security emails', description: 'Receive emails about your account security.', enabled: true },
];

const ROLES: Option[] = [
  { label: 'Owner', value: 'owner' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' },
];

const SHARE_ROLES: Option[] = [
  { label: 'Can edit', value: 'edit' },
  { label: 'Can view', value: 'view' },
];

const MONTHS: Option[] = [
  { label: 'January', value: '01' }, { label: 'February', value: '02' },
  { label: 'March', value: '03' }, { label: 'April', value: '04' },
  { label: 'May', value: '05' }, { label: 'June', value: '06' },
  { label: 'July', value: '07' }, { label: 'August', value: '08' },
  { label: 'September', value: '09' }, { label: 'October', value: '10' },
  { label: 'November', value: '11' }, { label: 'December', value: '12' },
];

const YEARS: Option[] = [
  { label: '2024', value: '2024' }, { label: '2025', value: '2025' },
  { label: '2026', value: '2026' }, { label: '2027', value: '2027' },
  { label: '2028', value: '2028' }, { label: '2029', value: '2029' },
];

const AREAS: Option[] = [
  { label: 'Team', value: 'team' }, { label: 'Billing', value: 'billing' },
  { label: 'Account', value: 'account' },
];

const SEVERITIES: Option[] = [
  { label: 'Severity 1 (Highest)', value: '1' }, { label: 'Severity 2', value: '2' },
  { label: 'Severity 3', value: '3' }, { label: 'Severity 4', value: '4' },
  { label: 'Severity 5 (Lowest)', value: '5' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule,
    ToggleSwitchModule, DividerModule, TextareaModule,
  ],
  template: `
    <!-- Header — matches React exactly -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <h1 class="text-lg font-semibold tracking-tight">MarketsUI Showcase</h1>
        <button pButton [text]="true" [rounded]="true"
          [icon]="isDark() ? 'pi pi-sun' : 'pi pi-moon'"
          (click)="toggleTheme()" class="!text-foreground"></button>
      </div>
    </header>

    <!-- Main — same grid as React: 1fr 420px -->
    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="grid gap-6 lg:grid-cols-[1fr_420px]">

        <!-- Left column -->
        <div class="space-y-6">

          <!-- 1. Payment Method -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Payment Method</h3>
              <p class="card-desc">Add a new payment method to your account.</p>
            </div>
            <div class="card-content space-y-4">
              <div class="grid grid-cols-3 gap-4">
                @for (m of paymentMethods; track m.value) {
                  <button class="flex flex-col items-center gap-1 py-3 rounded-md border transition-colors"
                    [class]="paymentMethod() === m.value
                      ? 'border-foreground bg-transparent'
                      : 'border-border bg-transparent hover:bg-muted/50'"
                    (click)="paymentMethod.set(m.value)">
                    <i [class]="m.icon + ' text-lg'"></i>
                    <span class="text-xs">{{ m.label }}</span>
                  </button>
                }
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Name</label>
                <input pInputText placeholder="First Last" class="w-full" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Card number</label>
                <input pInputText class="w-full" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Expires</label>
                  <p-select [options]="months" placeholder="Month" optionLabel="label"
                    optionValue="value" styleClass="w-full" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Year</label>
                  <p-select [options]="years" placeholder="Year" optionLabel="label"
                    optionValue="value" styleClass="w-full" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">CVC</label>
                <input pInputText placeholder="CVC" class="w-full" />
              </div>
            </div>
            <div class="card-footer">
              <button pButton label="Continue" class="w-full"></button>
            </div>
          </div>

          <!-- 2. Team Members -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Team Members</h3>
              <p class="card-desc">Invite your team members to collaborate.</p>
            </div>
            <div class="card-content space-y-4">
              @for (member of team; track member.email) {
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="avatar">{{ member.initials }}</div>
                    <div>
                      <p class="text-sm font-medium leading-none">{{ member.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ member.email }}</p>
                    </div>
                  </div>
                  <p-select [options]="roles" [(ngModel)]="member.role" optionLabel="label"
                    optionValue="value" styleClass="w-28" />
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="space-y-6">

          <!-- 3. Report an Issue -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Report an issue</h3>
              <p class="card-desc">What area are you having problems with?</p>
            </div>
            <div class="card-content space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Area</label>
                  <p-select [options]="areas" optionLabel="label" optionValue="value"
                    styleClass="w-full" [(ngModel)]="areaValue" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Security Level</label>
                  <p-select [options]="severities" optionLabel="label" optionValue="value"
                    styleClass="w-full" [(ngModel)]="severityValue" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Subject</label>
                <input pInputText placeholder="I need help with..." class="w-full" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Description</label>
                <textarea pTextarea placeholder="Please include all information relevant to your issue."
                  class="w-full" [rows]="3"></textarea>
              </div>
            </div>
            <div class="card-footer flex justify-between">
              <button pButton label="Cancel" [text]="true" class="!text-foreground"></button>
              <button pButton label="Submit" [outlined]="true"></button>
            </div>
          </div>

          <!-- 4. Share Document -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Share this document</h3>
              <p class="card-desc">Anyone with the link can view this document.</p>
            </div>
            <div class="card-content space-y-4">
              <div class="flex gap-2">
                <input pInputText value="http://example.com/link/to/document" readonly class="flex-1" />
                <button pButton icon="pi pi-copy" [outlined]="true" class="shrink-0"></button>
              </div>
              <hr class="border-border" />
              <div class="space-y-4">
                <h4 class="text-sm font-medium">People with access</h4>
                @for (user of shareUsers; track user.email) {
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="avatar">{{ user.initials }}</div>
                      <div>
                        <p class="text-sm font-medium leading-none">{{ user.name }}</p>
                        <p class="text-sm text-muted-foreground">{{ user.email }}</p>
                      </div>
                    </div>
                    <p-select [options]="shareRoles" [(ngModel)]="user.permission" optionLabel="label"
                      optionValue="value" styleClass="w-28" />
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- 5. Notifications -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Notifications</h3>
              <p class="card-desc">Choose what you want to be notified about.</p>
            </div>
            <div class="card-content space-y-4">
              @for (n of notifications; track n.key) {
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1 space-y-1">
                    <p class="text-sm font-medium leading-none">{{ n.title }}</p>
                    <p class="text-sm text-muted-foreground">{{ n.description }}</p>
                  </div>
                  <p-toggleswitch [(ngModel)]="n.enabled" />
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom full-width — matches React layout -->
      <div class="mt-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Sales</h3>
            <p class="card-desc">You made 265 sales this month.</p>
          </div>
          <div class="card-content space-y-4">
            @for (sale of sales; track sale.email) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="avatar">{{ sale.initials }}</div>
                  <div>
                    <p class="text-sm font-medium leading-none">{{ sale.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ sale.email }}</p>
                  </div>
                </div>
                <span class="font-mono text-sm font-medium">{{ sale.amount }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    /* Card — pure CSS, matches React shadcn Card exactly */
    .card {
      border-radius: 0.5rem;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1);
    }
    .card-header { display: flex; flex-direction: column; gap: 6px; padding: 24px; }
    .card-title { font-size: 18px; font-weight: 600; line-height: 1; letter-spacing: -0.025em; }
    .card-desc { font-size: 14px; color: hsl(var(--muted-foreground)); }
    .card-content { padding: 0 24px 24px; }
    .card-footer { display: flex; align-items: center; padding: 0 24px 24px; }

    /* Avatar — matches React exactly */
    .avatar {
      display: flex; width: 36px; height: 36px; flex-shrink: 0;
      align-items: center; justify-content: center; border-radius: 9999px;
      background: hsl(var(--primary) / 0.1); color: hsl(var(--primary));
      font-size: 12px; font-weight: 500;
    }

    /* PrimeNG Input overrides — match shadcn Input h-9 */
    :host ::ng-deep .p-inputtext {
      background: transparent;
      border-color: hsl(var(--input));
      color: hsl(var(--foreground));
      border-radius: calc(var(--mdl-radius) - 2px);
      font-size: 14px;
      height: 36px;
      padding: 4px 12px;
    }
    :host ::ng-deep .p-inputtext::placeholder { color: hsl(var(--muted-foreground)); }
    :host ::ng-deep .p-inputtext:focus {
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 1px hsl(var(--ring));
    }
    :host ::ng-deep textarea.p-inputtext {
      height: auto;
      min-height: 80px;
      padding: 8px 12px;
    }

    /* PrimeNG Select overrides — match shadcn Select h-9 */
    :host ::ng-deep .p-select {
      background: transparent;
      border-color: hsl(var(--input));
      border-radius: calc(var(--mdl-radius) - 2px);
      font-size: 14px;
      height: 36px;
    }
    :host ::ng-deep .p-select .p-select-label { color: hsl(var(--foreground)); font-size: 14px; }
    :host ::ng-deep .p-select-dropdown { color: hsl(var(--muted-foreground)); }

    /* PrimeNG Button overrides — match shadcn Button h-9 */
    :host ::ng-deep .p-button {
      border-radius: calc(var(--mdl-radius) - 2px);
      font-size: 14px;
      font-weight: 500;
      height: 36px;
    }
    :host ::ng-deep .p-button.p-button-outlined {
      border-color: hsl(var(--input));
      color: hsl(var(--foreground));
    }

    /* ToggleSwitch — match shadcn Switch */
    :host ::ng-deep .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
      background: hsl(var(--primary));
    }
    :host ::ng-deep .p-toggleswitch .p-toggleswitch-slider {
      background: hsl(var(--input));
    }
  `],
})
export class AppComponent {
  private document = inject(DOCUMENT);

  isDark = signal(true);
  paymentMethod = signal('apple');

  /* Data — identical to React */
  paymentMethods = [
    { value: 'card', label: 'Card', icon: 'pi pi-credit-card' },
    { value: 'paypal', label: 'Paypal', icon: 'pi pi-paypal' },
    { value: 'apple', label: 'Apple', icon: 'pi pi-apple' },
  ];

  months = MONTHS;
  years = YEARS;
  roles = ROLES;
  areas = AREAS;
  severities = SEVERITIES;
  shareRoles = SHARE_ROLES;
  team: TeamMember[] = [...TEAM];
  sales = SALES;
  shareUsers: ShareUser[] = [...SHARE_USERS];
  notifications: Notification[] = [...NOTIFICATIONS];

  areaValue = 'team';
  severityValue = '2';

  toggleTheme(): void {
    const dark = this.document.documentElement.classList.toggle('dark');
    this.isDark.set(dark);
  }
}
