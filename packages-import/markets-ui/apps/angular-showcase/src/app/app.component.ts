import { Component, ChangeDetectionStrategy, signal, DOCUMENT, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { RadioButtonModule } from 'primeng/radiobutton';

/* ── Data ── */
interface TeamMember {
  name: string;
  email: string;
  initials: string;
  role: string;
}

interface Sale {
  name: string;
  email: string;
  initials: string;
  amount: string;
}

interface RoleOption {
  label: string;
  value: string;
}

const ROLES: RoleOption[] = [
  { label: 'Viewer', value: 'Viewer' },
  { label: 'Developer', value: 'Developer' },
  { label: 'Billing', value: 'Billing' },
  { label: 'Owner', value: 'Owner' },
];

const AREA_OPTIONS: RoleOption[] = [
  { label: 'Team', value: 'Team' },
  { label: 'Billing', value: 'Billing' },
  { label: 'Account', value: 'Account' },
  { label: 'Deployments', value: 'Deployments' },
  { label: 'Support', value: 'Support' },
];

const SEVERITY_OPTIONS: RoleOption[] = [
  { label: 'Severity 1 (Critical)', value: '1' },
  { label: 'Severity 2 (High)', value: '2' },
  { label: 'Severity 3 (Medium)', value: '3' },
  { label: 'Severity 4 (Low)', value: '4' },
];

const TEAM: TeamMember[] = [
  { name: 'Sofia Davis', email: 'sofia@example.com', initials: 'SD', role: 'Owner' },
  { name: 'Jackson Lee', email: 'jackson@example.com', initials: 'JL', role: 'Developer' },
  { name: 'Isabella Nguyen', email: 'isabella@example.com', initials: 'IN', role: 'Viewer' },
];

const SALES: Sale[] = [
  { name: 'Olivia Martin', email: 'olivia@email.com', initials: 'OM', amount: '+$1,999.00' },
  { name: 'Jackson Lee', email: 'jackson@email.com', initials: 'JL', amount: '+$39.00' },
  { name: 'Isabella Nguyen', email: 'isabella@email.com', initials: 'IN', amount: '+$299.00' },
  { name: 'William Kim', email: 'will@email.com', initials: 'WK', amount: '+$99.00' },
  { name: 'Sofia Davis', email: 'sofia@email.com', initials: 'SD', amount: '+$39.00' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    TabsModule,
    DividerModule,
    TextareaModule,
    TagModule,
    RadioButtonModule,
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold tracking-tight">MarketsUI Showcase</span>
          <p-tag value="Angular" [rounded]="true" severity="secondary" />
        </div>
        <button pButton [text]="true" [rounded]="true"
          [icon]="isDark() ? 'pi pi-sun' : 'pi pi-moon'"
          (click)="toggleTheme()"
          class="!text-foreground"></button>
      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="mt-1 text-muted-foreground">PrimeNG components styled with MarketsUI design tokens.</p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">

        <!-- 1. Payment Method -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Payment Method</h3>
              <p class="text-sm text-muted-foreground">Add a new payment method to your account.</p>
            </div>
          </ng-template>

          <div class="flex gap-3 mb-4">
            @for (method of paymentMethods; track method.value) {
              <label class="flex-1 cursor-pointer rounded-lg border-2 p-3 text-center transition-colors"
                [class.border-foreground]="paymentMethod() === method.value"
                [class.border-border]="paymentMethod() !== method.value">
                <p-radioButton [name]="'payment'" [value]="method.value"
                  [(ngModel)]="paymentMethodValue"
                  (ngModelChange)="paymentMethod.set($event)"
                  styleClass="hidden" />
                <i [class]="method.icon + ' text-xl mb-1 block'"></i>
                <span class="text-xs font-medium">{{ method.label }}</span>
              </label>
            }
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-1 block">Name</label>
              <input pInputText placeholder="First Last" class="w-full" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Card number</label>
              <input pInputText placeholder="0000 0000 0000 0000" class="w-full" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">Expires</label>
                <p-select [options]="months" placeholder="Month" styleClass="w-full" />
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">Year</label>
                <p-select [options]="years" placeholder="Year" styleClass="w-full" />
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">CVC</label>
                <input pInputText placeholder="CVC" class="w-full" />
              </div>
            </div>
          </div>

          <ng-template #footer>
            <button pButton label="Continue" class="w-full"></button>
          </ng-template>
        </p-card>

        <!-- 2. Team Members -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Team Members</h3>
              <p class="text-sm text-muted-foreground">Invite your team members to collaborate.</p>
            </div>
          </ng-template>

          <div class="space-y-4">
            @for (member of team; track member.email) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {{ member.initials }}
                  </div>
                  <div>
                    <p class="text-sm font-medium leading-none">{{ member.name }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ member.email }}</p>
                  </div>
                </div>
                <p-select [options]="roles" [(ngModel)]="member.role"
                  optionLabel="label" optionValue="value" styleClass="w-32" />
              </div>
            }
          </div>
        </p-card>

        <!-- 3. Report an Issue -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Report an Issue</h3>
              <p class="text-sm text-muted-foreground">What area are you having problems with?</p>
            </div>
          </ng-template>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">Area</label>
                <p-select [options]="areaOptions" placeholder="Select" styleClass="w-full"
                  optionLabel="label" optionValue="value" />
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">Severity</label>
                <p-select [options]="severityOptions" placeholder="Select" styleClass="w-full"
                  optionLabel="label" optionValue="value" />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Subject</label>
              <input pInputText placeholder="I need help with..." class="w-full" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">Description</label>
              <textarea pTextarea placeholder="Please include all relevant information..."
                class="w-full" [rows]="4"></textarea>
            </div>
          </div>

          <ng-template #footer>
            <div class="flex justify-between w-full">
              <button pButton label="Cancel" [outlined]="true"></button>
              <button pButton label="Submit"></button>
            </div>
          </ng-template>
        </p-card>

        <!-- 4. Share Document -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Share Document</h3>
              <p class="text-sm text-muted-foreground">Anyone with the link can view this document.</p>
            </div>
          </ng-template>

          <div class="space-y-4">
            <div class="flex gap-2">
              <input pInputText value="https://example.com/link/to/document"
                class="w-full" readonly />
              <button pButton icon="pi pi-copy" [outlined]="true"></button>
            </div>

            <p-divider />

            <h4 class="text-sm font-medium">People with access</h4>

            @for (member of team; track member.email) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {{ member.initials }}
                  </div>
                  <div>
                    <p class="text-sm font-medium leading-none">{{ member.name }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ member.email }}</p>
                  </div>
                </div>
                <p-select [options]="shareRoles" [(ngModel)]="member.role"
                  optionLabel="label" optionValue="value" styleClass="w-28" />
              </div>
            }
          </div>
        </p-card>

        <!-- 5. Notifications -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Notifications</h3>
              <p class="text-sm text-muted-foreground">Choose what notifications you want to receive.</p>
            </div>
          </ng-template>

          <div class="space-y-4">
            @for (n of notifications; track n.key) {
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ n.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ n.description }}</p>
                </div>
                <p-toggleswitch [(ngModel)]="n.enabled" />
              </div>
            }
          </div>
        </p-card>

        <!-- 6. Recent Sales -->
        <p-card>
          <ng-template #header>
            <div class="px-6 pt-6">
              <h3 class="text-lg font-semibold">Recent Sales</h3>
              <p class="text-sm text-muted-foreground">You made 265 sales this month.</p>
            </div>
          </ng-template>

          <div class="space-y-5">
            @for (sale of sales; track sale.email) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {{ sale.initials }}
                  </div>
                  <div>
                    <p class="text-sm font-medium leading-none">{{ sale.name }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ sale.email }}</p>
                  </div>
                </div>
                <span class="text-sm font-semibold">{{ sale.amount }}</span>
              </div>
            }
          </div>
        </p-card>

      </div>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    /* Scope PrimeNG card overrides */
    :host ::ng-deep .p-card {
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      border: 1px solid hsl(var(--border));
      border-radius: var(--mdl-radius-lg);
      box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1);
    }
    :host ::ng-deep .p-card-body { padding: 0; }
    :host ::ng-deep .p-card-header { padding: 0; }
    :host ::ng-deep .p-card-content { padding: 0 1.5rem; }
    :host ::ng-deep .p-card-footer { padding: 0 1.5rem 1.5rem; }

    /* PrimeNG input overrides */
    :host ::ng-deep .p-inputtext {
      background: transparent;
      border-color: hsl(var(--border));
      color: hsl(var(--foreground));
      border-radius: var(--mdl-radius-sm);
      font-size: var(--mdl-font-sm);
      height: var(--mdl-height-default);
    }
    :host ::ng-deep .p-inputtext::placeholder { color: hsl(var(--muted-foreground)); }
    :host ::ng-deep .p-inputtext:focus {
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
    }

    /* Textarea */
    :host ::ng-deep textarea.p-inputtext { height: auto; }

    /* Button overrides */
    :host ::ng-deep .p-button {
      border-radius: var(--mdl-radius-sm);
      font-size: var(--mdl-font-sm);
      font-weight: 500;
      height: var(--mdl-height-default);
    }

    /* Select overrides */
    :host ::ng-deep .p-select {
      background: transparent;
      border-color: hsl(var(--border));
      border-radius: var(--mdl-radius-sm);
      font-size: var(--mdl-font-sm);
      height: var(--mdl-height-default);
    }

    /* Tag */
    :host ::ng-deep .p-tag { font-size: 11px; }

    /* Toggle switch accent */
    :host ::ng-deep .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
      background: hsl(var(--foreground));
    }
  `],
})
export class AppComponent {
  private document = inject(DOCUMENT);

  /* ── Signals ── */
  isDark = signal(true);
  paymentMethod = signal('card');
  paymentMethodValue = 'card';

  /* ── Static data ── */
  paymentMethods = [
    { value: 'card', label: 'Card', icon: 'pi pi-credit-card' },
    { value: 'paypal', label: 'PayPal', icon: 'pi pi-paypal' },
    { value: 'apple', label: 'Apple', icon: 'pi pi-apple' },
  ];

  months = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];

  years = ['2026','2027','2028','2029','2030'];

  roles = ROLES;
  areaOptions = AREA_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  team: TeamMember[] = [...TEAM];
  sales = SALES;

  shareRoles: RoleOption[] = [
    { label: 'Can edit', value: 'edit' },
    { label: 'Can view', value: 'view' },
  ];

  notifications = [
    { key: 'comms', title: 'Communication emails', description: 'Receive emails about your account activity.', enabled: false },
    { key: 'marketing', title: 'Marketing emails', description: 'Receive emails about new products, features, and more.', enabled: false },
    { key: 'social', title: 'Social emails', description: 'Receive emails for friend requests, follows, and more.', enabled: true },
    { key: 'security', title: 'Security emails', description: 'Receive emails about your account security.', enabled: true },
  ];

  toggleTheme(): void {
    const html = this.document.documentElement;
    const dark = html.classList.toggle('dark');
    this.isDark.set(dark);
  }
}
