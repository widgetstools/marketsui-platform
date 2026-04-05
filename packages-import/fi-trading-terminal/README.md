# MarketsUI FI Trading Terminal

A fixed income trading terminal built as a monorepo to showcase a **shared design system** across React and Angular frameworks. Both apps look and behave nearly identically — same colors, typography, component styling, and AG Grid theming — all driven from a single set of design tokens.

## Monorepo Structure

```
fi-trading-terminal/
├── design-system/              ← Shared design tokens & adapters
│   ├── tokens/
│   │   ├── primitives.ts       ← Color palettes, type scale, spacing, radius
│   │   ├── semantic.ts         ← Dark/light color schemes (surface, text, border, accent)
│   │   └── components.ts       ← Per-component tokens (button, input, tab, badge, table)
│   ├── adapters/
│   │   ├── shadcn.ts           ← CSS variable generator for shadcn/ui (React)
│   │   ├── primeng.ts          ← definePreset() generator for PrimeNG (Angular)
│   │   └── ag-grid.ts          ← AG Grid param objects for themeQuartz.withParams()
│   ├── themes/
│   │   ├── fi-dark.css         ← Pre-built dark theme CSS variables
│   │   └── fi-light.css        ← Pre-built light theme CSS variables
│   └── index.ts                ← Public API
├── react-app/                  ← React 19 + Vite + shadcn/ui + AG Grid
├── angular-app/                ← Angular 19 + PrimeNG + AG Grid
└── README.md
```

## Quick Start

```bash
# React app
cd react-app
npm install
npm run dev                     # → http://localhost:5173

# Angular app
cd angular-app
npm install
npx ng serve                    # → http://localhost:4200
```

---

## Design System

### Token Architecture

The design system uses a three-tier token hierarchy:

| Tier | File | Purpose |
|------|------|---------|
| **Primitives** | `tokens/primitives.ts` | Raw values — color scales (neutral, teal, red, amber, blue, cyan, purple), font families, 4-tier font sizes (9/11/13/18px), spacing, radius, opacity, transitions |
| **Semantic** | `tokens/semantic.ts` | Purpose-driven mappings — `surface.ground`, `text.primary`, `accent.positive`, `action.buyBg`, etc. Separate `dark` and `light` color schemes |
| **Components** | `tokens/components.ts` | Per-component overrides — button, input, tab, badge, table, card, tooltip, scrollbar |

### Color Palette

| Role | Dark Mode | Light Mode |
|------|-----------|------------|
| Surface ground | `#0b0e11` | `#f5f5f5` |
| Surface primary | `#161a1e` | `#ffffff` |
| Text primary | `#eaecef` | `#1a1a2e` |
| Text secondary | `#a0a8b4` | `#5f6673` |
| Border | `#313944` | `#e0e3e7` |
| Positive (buy) | `#2dd4bf` (teal-400) | `#0d9488` (teal-600) |
| Negative (sell) | `#f87171` (red-400) | `#dc2626` (red-600) |
| Warning | `#f0b90b` | `#b45309` |
| Info | `#3da0ff` | `#2563eb` |

### Typography Scale

| Tier | Size | Usage |
|------|------|-------|
| `xs` | 9px | Column headers, badges, timestamps, captions |
| `sm` | 11px | Body text, table cells, data values **(default)** |
| `md` | 13px | Section titles, CTA buttons |
| `lg` | 18px | KPI headline numbers |

- **Data font**: JetBrains Mono (monospace) — all numbers, prices, codes
- **UI font**: Geist (sans-serif) — labels, navigation, headings

---

## Using the Design System

### Option 1: Drop-in CSS (any framework)

Import the pre-built CSS files — no TypeScript build required:

```css
@import 'path/to/design-system/themes/fi-dark.css';
@import 'path/to/design-system/themes/fi-light.css';
```

Toggle themes by setting `data-theme="dark"` or `data-theme="light"` on the `<html>` element. All `var(--bn-*)` and `var(--fi-*)` CSS variables switch automatically.

### Option 2: React + shadcn/ui

**1. Install shadcn/ui** in your React project as usual.

**2. Import the CSS themes** in your `globals.css` or `index.css`:

```css
@import 'path/to/design-system/themes/fi-dark.css';
@import 'path/to/design-system/themes/fi-light.css';
```

This overrides all shadcn CSS variables (`--background`, `--foreground`, `--primary`, `--border`, etc.) plus adds the FI-specific tokens.

**3. AG Grid theming** — import the shared params and create the theme:

```typescript
// src/lib/agGridTheme.ts
import { themeQuartz } from 'ag-grid-community';
import { agGridLightParams, agGridDarkParams } from 'path/to/design-system/adapters/ag-grid';

export const fiGridTheme = themeQuartz
  .withParams(agGridLightParams as any, 'light')
  .withParams(agGridDarkParams as any, 'dark');
```

```tsx
// In your component
import { fiGridTheme } from './lib/agGridTheme';

<AgGridReact theme={fiGridTheme} ... />
```

**4. Dark mode toggle** — set both attributes:

```typescript
const mode = isDark ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', mode);  // CSS variables
document.body.dataset.agThemeMode = mode;                    // AG Grid
```

**5. Use CSS variables** in your components:

```tsx
<div style={{ background: 'var(--bn-bg1)', color: 'var(--bn-t0)', border: '1px solid var(--bn-border)' }}>
  <span style={{ color: 'var(--bn-green)' }}>+0.25</span>
</div>
```

### Option 3: Angular + PrimeNG

**1. Install PrimeNG** (v19+) with the Aura theme.

**2. Import the CSS themes** in your `styles.scss`:

```scss
@import 'path/to/design-system/themes/fi-dark.css';
@import 'path/to/design-system/themes/fi-light.css';
```

**3. Configure PrimeNG** with the FI preset in `app.config.ts`:

```typescript
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import { Aura } from '@primeng/themes/aura';
import { generatePrimeNGPreset } from 'path/to/design-system/adapters/primeng';

const FiTheme = definePreset(Aura, generatePrimeNGPreset() as any);

export const appConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: FiTheme,
        options: { darkModeSelector: '[data-theme="dark"]' }
      }
    })
  ]
};
```

**4. AG Grid theming** — same adapter, same pattern:

```typescript
// src/app/services/ag-grid-theme.ts
import { themeQuartz } from 'ag-grid-community';
import { agGridLightParams, agGridDarkParams } from '@design-system/adapters/ag-grid';

export const fiGridTheme = themeQuartz
  .withParams(agGridLightParams as any, 'light')
  .withParams(agGridDarkParams as any, 'dark');
```

```typescript
// In your component
import { fiGridTheme } from '../services/ag-grid-theme';

@Component({
  template: '<ag-grid-angular [theme]="theme" [rowData]="data" [columnDefs]="cols" />'
})
export class MyGrid {
  theme = fiGridTheme;
}
```

**5. Dark mode toggle**:

```typescript
const mode = isDark ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', mode);
document.body.dataset['agThemeMode'] = mode;
```

**6. Path alias** — add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@design-system/*": ["../design-system/*"]
    }
  }
}
```

### Option 4: Programmatic Token Access

Import tokens directly in TypeScript for dynamic use:

```typescript
import { dark, light, shared } from 'path/to/design-system/tokens/semantic';
import { colors, typography } from 'path/to/design-system/tokens/primitives';
import { componentTokens } from 'path/to/design-system/tokens/components';

// Access semantic values
console.log(dark.surface.primary);     // '#161a1e'
console.log(dark.accent.positive);     // '#2dd4bf'
console.log(shared.typography.fontSize.sm); // '11px'

// Get component-level tokens for a scheme
const darkComponents = componentTokens(dark);
console.log(darkComponents.button.buy.background); // '#0d9488'
console.log(darkComponents.table.headerBackground); // '#1e2329'
```

---

## CSS Variable Reference

### Surface & Layout

| Variable | Dark | Light | Usage |
|----------|------|-------|-------|
| `--bn-bg` | `#0b0e11` | `#f5f5f5` | Page background |
| `--bn-bg1` | `#161a1e` | `#ffffff` | Card/panel background |
| `--bn-bg2` | `#1e2329` | `#f0f1f3` | Hover/header background |
| `--bn-bg3` | `#2b3139` | `#e6e8eb` | Active/pressed background |
| `--bn-border` | `#313944` | `#e0e3e7` | Borders, dividers |
| `--bn-border2` | `#3e4754` | `#d1d5db` | Interactive borders |

### Text

| Variable | Dark | Light | Usage |
|----------|------|-------|-------|
| `--bn-t0` | `#eaecef` | `#1a1a2e` | Primary text |
| `--bn-t1` | `#a0a8b4` | `#5f6673` | Labels, descriptions |
| `--bn-t2` | `#7a8494` | `#9ca3af` | Captions, muted |
| `--bn-t3` | `#4a5568` | `#d1d5db` | Disabled, placeholder |

### Semantic Colors

| Variable | Dark | Light | Usage |
|----------|------|-------|-------|
| `--bn-green` | `#2dd4bf` | `#0d9488` | Buy, positive, success |
| `--bn-red` | `#f87171` | `#dc2626` | Sell, negative, error |
| `--bn-yellow` | `#f0b90b` | `#b45309` | Warning, highlight |
| `--bn-blue` | `#3da0ff` | `#2563eb` | Info, links |
| `--bn-cyan` | `#22d3ee` | `#0891b2` | Secondary accent |

### Typography

| Variable | Value | Usage |
|----------|-------|-------|
| `--fi-mono` | `'JetBrains Mono', monospace` | Data, numbers |
| `--fi-sans` | `'Geist', sans-serif` | UI labels |
| `--fi-font-xs` | `9px` | Column headers, badges |
| `--fi-font-sm` | `11px` | Body text (default) |
| `--fi-font-md` | `13px` | Buttons, titles |
| `--fi-font-lg` | `18px` | KPI numbers |

---

## Tech Stack

| | React App | Angular App |
|---|---|---|
| Framework | React 19 + Vite 8 | Angular 19 |
| Components | shadcn/ui (Radix) | PrimeNG (Aura) |
| Data Grid | AG Grid Enterprise 35 | AG Grid Enterprise 35 |
| Layout | @widgetstools/react-dock-manager | @widgetstools/angular-dock-manager |
| Styling | Tailwind CSS 3.4 | SCSS + CSS variables |
| Fonts | JetBrains Mono + Geist | JetBrains Mono + Geist |

## AG Grid Enterprise License

Both apps use AG Grid Enterprise 35. For production, replace the empty license key:

```typescript
LicenseManager.setLicenseKey('YOUR_LICENSE_KEY_HERE');
```

Without a valid key, AG Grid runs in trial mode (watermark only, fully functional).
