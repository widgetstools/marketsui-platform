# Implemented Features

AG-Grid Customization Platform — an open-source AdapTable alternative for the MarketsUI FI Trading Terminal.

---

## 1. Core Architecture

### Plugin-Based Module System
- 18 feature modules with priority-ordered transform pipeline
- Each module has its own state, settings panel, and column/grid transforms
- Modules: General Settings, Theming, Column Templates, Column Customization, Column Groups, Conditional Styling, Calculated Columns, Named Queries, Cell Flashing, Entitlements, Data Management, Sort & Filter, Editing, Undo/Redo, Export & Clipboard, Performance, Expression Editor, Profiles

### Zustand State Management
- Per-grid store factory (`createGridStore`) with module state slices
- Draft store pattern (`DraftStoreProvider`) for settings panel isolation — edits don't apply until "Apply" is clicked
- Store bindings updated on React strict mode re-mounts via `updateStoreBindings()`

### CSP-Safe Expression Engine
- Custom tokenizer, Pratt parser, AST tree-walk evaluator — no `eval()` or `new Function()` for user expressions
- Used by: Conditional Styling, Cell Flashing, Entitlements, Calculated Columns
- Built-in functions: math (ABS, ROUND, MIN, MAX), string (UPPER, LOWER, TRIM, SUBSTRING, REPLACE, LEN, CONTAINS), logic (IF, AND, OR, NOT), comparison operators
- Safe `REPLACE` with regex metacharacter escaping
- `SUBSTRING` uses modern `String.prototype.substring()` (not deprecated `substr`)

### Multi-Grid Support
- Each grid instance has fully isolated state:
  - Separate Zustand store (keyed by `gridId`)
  - Separate `<style>` element via `CssInjector` (`data-grid-customizer={gridId}`)
  - Separate `ExpressionEngine` instance (created in `GridCustomizerCore`, passed via `ModuleContext`)
  - Separate per-grid module context maps (column-customization, cell-flashing, conditional-styling, etc.)
- localStorage keys include gridId: `gc-state:{gridId}`
- Multiple `<MarketsGrid>` components with different `gridId` props can coexist in the same app

### Persistence
- **Explicit save only** — no auto-persist; state saves to localStorage only when user clicks the Save button
- Auto-load from localStorage on initialization (restores previously saved state)
- Storage adapters: `LocalStorageAdapter`, `DexieAdapter` (IndexedDB), `RestAdapter` (HTTP API)
- `RestAdapter` validates `response.ok` on all HTTP methods

---

## 2. Formatting Toolbar

### Excel-Style Toolbar
- Appears above the grid with grouped tool clusters
- 42px height with `bg-card` background and `border-border` bottom border
- Layout order: Column Context → Templates → Font & Text → Alignment → Number Format → Borders → History + Actions
- All icons from Lucide React with consistent 14px size, 1.75 stroke weight
- Two-state contrast: 55% opacity when no cell selected, 85% when cell selected (1.0 on hover)
- `gc-toolbar-enabled` CSS class toggles contrast on cell selection
- `z-index: 10000` ensures dropdowns/popovers render above AG-Grid
- 16px horizontal padding via inline style (immune to Tailwind/preflight conflicts)
- TGroup containers with `bg-accent/40` background, `rounded-md`, `gap-[3px]` internal spacing
- All custom CSS classes (`gc-tbtn`, `gc-tbtn-active`, `gc-toolbar-sep`) in `@layer components`

### Cell/Header Toggle
- iOS-style segmented control with two side-by-side Shadcn `<Button>` components
- Active segment uses `bg-primary text-primary-foreground`, inactive uses `ghost` variant
- 14px horizontal padding per button, `h-7` height, `rounded-none` with `rounded-md` on container
- Switches all formatting actions between cell styling and header styling
- Header styles use functional `headerStyle` (excludes floating filters) + `headerClass` for CSS injection
- Cell styles use `cellClass` + CSS injection with `!important`

### Typography Controls
- **Bold** (B): toggles `font-weight: 700` / removes
- **Italic** (I): toggles `font-style: italic` / removes
- **Underline** (U): toggles `text-decoration: underline` / removes
- All write to `cellStyleOverrides` / `headerStyleOverrides` on the `ColumnAssignment` (not templates)

### Text & Background Color
- Color picker with 10-column × 6-row grid (19px rounded swatches, 2px gaps):
  - Row 1: Grayscale (white to black)
  - Row 2: Vivid saturated (rainbow)
  - Row 3: Medium-dark variants
  - Row 4: Light tints
  - Row 5: Pastels
  - Row 6: Very light
- Recent colors section (up to 10, persisted in `localStorage` as `gc-recent-colors`) with "RECENT" label
- Bottom bar with 4 equally-sized 22px controls:
  - Pipette icon: opens native system color picker
  - Hex input: editable text field with `JetBrains Mono` font, validates on blur/Enter
  - × button: clears color
  - ✓ button: confirms selection (foreground/background swap for active state)
- Draft/confirm pattern — select colors without applying until ✓ is clicked
- Selected swatch highlighted with 2px CSS `outline` in `var(--primary)` color
- Container: 8px padding, 8px border-radius, deep shadow (`0 8px 32px rgba(0,0,0,0.3)`)
- All colors via CSS variables — fully theme-aware for light/dark mode
- Shared `ColorPicker` / `ColorPickerPopover` components in `@grid-customizer/core`

### Alignment
- Left / Center / Right alignment buttons
- Cell: applies `text-align` via CSS injection
- Header: converts to `justify-content: flex-start/center/flex-end` on `.ag-header-cell-label` (AG-Grid headers use flexbox)

### Font Size
- Popover dropdown with sizes: 9px, 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 24px
- Active size highlighted in primary (amber) color
- Shows current size in mono font with ChevronDown indicator

### Number Formatting
- **Currency** ($): Popover with USD, EUR, GBP, JPY options using `Intl.NumberFormat`
- **Percentage** (%): Toggles `Intl.NumberFormat` with `style:'percent'`
- **Thousands separator** (#): Formats with `maximumFractionDigits:0`
- **Decimal controls** (←.0 / .0→): Increment/decrement decimal places
- Formatters use `new Function` for `Intl.NumberFormat` expressions (developer-authored presets)
- Written to `ColumnAssignment.valueFormatterTemplate` (per-column override)

### Border Editor
- Grid3X3 icon opens border popover (240px wide)
- **Header**: "BORDERS" title in uppercase
- **Cell preview**: inner rectangle showing active borders with dashed inactive borders, "Cell" or "Header" label
- **6 preset buttons** in a row: All, Top, Right, Btm, Left, None
  - Each with a custom `BorderIcon` SVG showing which edge is highlighted
  - Active buttons get `var(--primary)` border + tinted background
  - "None" button in `var(--destructive)` color
- **Bottom bar**: color swatch + style dropdown (Solid/Dashed/Dotted/Double) + width selector (1-4)
- **Implementation**: borders rendered via `::after` pseudo-element with `box-shadow: inset` — does NOT use CSS `border` or `box-shadow` on the cell itself
- AG-Grid cell selection (`box-shadow`) and column separators (`border-right`) remain unaffected
- `inset: 0` positioning (not `-1px`) because AG-Grid cells have `overflow: hidden`

### Template Dropdown
- Appears when cells are selected, between column context and number format groups
- LayoutTemplate icon + `<select>` dropdown listing all templates alphabetically
- Selecting a template assigns it to all selected columns via `templateIds`
- Shows "No templates yet" when empty

### Save As Template (+)
- Plus icon button opens a Popover with name input
- "Save Template" confirm button (primary color)
- Captures the column's merged cell style, header style, and value formatter
- Creates a new template with auto-generated ID (`tpl_{timestamp}_{random}`)
- Flash checkmark feedback on save
- New template immediately appears in the dropdown

### Undo / Redo
- Undo2 / Redo2 icons
- Undo point pushed before every formatting action
- Deep-clone via `JSON.parse(JSON.stringify())` (max 20 history entries)
- Clear All pushes an undo point first (recoverable)

### Clear All
- Trash2 icon — resets all templates, assignments, and CSS rules
- Strips stale `headerStyle` inline properties directly from DOM elements
- Calls `cssInjector.clear()` to remove all injected `<style>` content
- Flash checkmark feedback (400ms)

### Save
- Save icon — serializes all module state to `localStorage`
- Flash checkmark feedback (400ms)
- **Explicit save only** — no auto-persist; styles only save when the user clicks Save
- Auto-persist `useEffect` removed to prevent unintended localStorage writes

---

## 3. Styling Architecture

### Cell Styling
- Uses `cellClass` with CSS injection (NOT `cellStyle` inline)
- All properties applied with `!important` to override theme defaults and renderer inline styles
- Inheritable properties (color, font-*, text-*) applied to both `.gc-col-c-{colId}` and `.gc-col-c-{colId} *`
- Non-inheritable properties (background-color, padding) applied to cell only
- `cellClassRules` reserved for conditional styling module

### Header Styling
- Functional `headerStyle` for inline properties (excludes floating filters via `params.floatingFilter`)
- `headerClass` for CSS injection targets (alignment, border overlays)
- Reset function returns `{ fontWeight: '', fontStyle: '', ... }` to clear AG-Grid's cached inline styles

### Border Implementation
- `::after` pseudo-element overlay with `box-shadow: inset`
- `pointer-events: none` so AG-Grid selection works through it
- `z-index: 1` above cell content
- Separate CSS rule from main styling (injected via `col-bo-{colId}`)
- AG-Grid cell selection (`box-shadow` on cell) and column separators (`border-right`) unaffected

### Per-Column Overrides vs Templates
- Toolbar writes to `ColumnAssignment.cellStyleOverrides` / `headerStyleOverrides` / `valueFormatterTemplate`
- Templates are only created explicitly via "Save As Template" button or Settings panel
- `resolveColumn()` merges: type defaults → templates (sorted by `updatedAt`) → per-column overrides (highest precedence)

---

## 4. Template System

### Multi-Template Composition
- Each column has `templateIds: string[]` — ordered list of templates to compose
- Styles merge property-by-property: newer `updatedAt` wins for each key
- Per-column `cellStyleOverrides` / `headerStyleOverrides` override all templates

### Template Management (Settings Panel)
- Templates tab: create, edit, delete templates with full style editor
- Each template card shows assigned column count and column names (amber badges)
- Template editor shows "Applied to N columns" with column name badges
- "Apply to columns..." bulk apply modal with column picker
- Value formatter presets: Integer, Number (1-4 dp), USD/EUR/GBP/JPY, Percentage, Basis Points, Date/Time, Boolean, Custom expression

### Column Management (Settings Panel)
- Columns tab: per-column configuration (header name, width, pinning, visibility)
- Shows all assigned template names as amber badges in the column list
- "Add Template" dropdown to assign additional templates
- Individual template remove button per column
- "Edit" button navigates to Templates tab

---

## 5. Settings Panel

### Settings Sheet
- Slide-in panel with module navigation sidebar
- Draft store pattern — edits are isolated until "Apply" or "Apply & Close"
- ESC key closes with discard (stale closure fixed with `handleClose` dependency)
- Reset button to revert to initial state
- Module icons from Lucide React

### Module Panels
- All native HTML controls replaced with Shadcn UI components (Button, Input, Select, Switch, Label)
- Property panel UX (Figma-style collapsible sections)
- Column picker with search and multi-select

---

## 6. Theme Support

### Dark/Light Mode Toggle
- Sun/Moon toggle button in app header (top right)
- Theme preference persisted in `localStorage` (`gc-theme`)
- `data-theme="light"` attribute on `<html>` element

### Dark Theme (Default)
- FI Trading Terminal palette: `#0b0e11` ground, `#161a1e` surfaces, `#eaecef` text, `#f0b90b` primary accent
- AG-Grid `themeQuartz.withParams()` with matching colors

### Light Theme
- VS Code Light Modern inspired: `#f8f8f8` ground, `#ffffff` surfaces, `#3b3b3b` text, `#d97706` primary accent
- AG-Grid `themeQuartz.withParams()` with matching colors

### Theme-Aware Components
- All toolbar buttons use CSS variables (`--foreground`, `--muted-foreground`, `--accent`, `--primary`, `--border`, `--card`)
- `gc-tbtn`, `gc-tbtn-active`, `gc-toolbar-sep` CSS classes in `@layer components` (proper cascade order)
- Color picker uses CSS vars for all colors — no hardcoded hex values
- Border editor uses CSS vars for backgrounds, borders, text colors
- Shadcn `<Button>` components used for CELL/HDR toggle, border presets, save-as-template
- Base CSS reset moved to `@layer base` to avoid overriding Tailwind utilities
- AG-Grid header collapse overrides use `!important` outside layers (must override AG-Grid's own styles)

---

## 7. AG-Grid Integration

### Header/Filter Button Collapse
- Column header menu buttons and floating filter buttons hidden by default
- Appear on hover with 150ms CSS transition
- Space collapses when hidden (not just opacity)

### Grid Compatibility
- `cellClass` for static styling, `cellClassRules` reserved for conditional styling
- `headerStyle` (functional) + `headerClass` for header styling
- `getRowId` defined outside component for stable reference
- No `{...gridOptions}` spread (prevents row vanishing during fast scroll)
- `ModuleRegistry.registerModules([AllEnterpriseModule])` called once globally

### React Strict Mode Compatibility
- `CssInjector.destroy()` resets `dirty` flag so `scheduleFlush()` works after re-initialization
- `CssInjector.ensureStyleElement()` recreates detached style elements
- `GridCustomizerCore.updateStoreBindings()` syncs store references on re-mount
- Module context maps not deleted in `onGridDestroy` (core instance reused)

---

## 8. Design System

### FI Trading Terminal Tokens
- Sourced from `/Users/develop/projects/fi-trading-terminal/design-system/`
- Surface layers: ground → primary → secondary → tertiary
- Text hierarchy: primary → secondary → muted → faint
- Accent colors: teal (positive), red (negative), amber (warning/primary), blue (info), cyan (highlight), purple (tertiary)
- Typography: JetBrains Mono (data), Geist (UI), 9/11/13/18px scale
- Tailwind CSS v4 with `@theme inline` block mapping CSS variables

### Shadcn UI Components
- Button (7 variants: default, secondary, outline, ghost, destructive, link + sizes: xs, sm, md, lg, icon, icon-sm)
- Input, Select, Switch, Label, Separator, Popover, Tooltip
- ColorPicker, ColorPickerPopover (shared color picker component)
- All components in `packages/core/src/ui/shadcn/`

---

## 9. Testing

### E2E Tests (69 total)
- **Playwright** with Chromium, auto-starts dev server on port 5190
- `e2e/border-selection.spec.ts` (6 tests): Border overlay via `::after`, cell selection coexistence, column separator preservation
- `e2e/toolbar-features.spec.ts` (23 tests): All toolbar features including clear-all header styles
- `e2e/toolbar-buttons.spec.ts` (27 tests): Every button on cells AND headers, cell/header independence
- `e2e/templates.spec.ts` (13 tests): Template dropdown, apply template, save-as-template, persistence, composition
- `clickToolbarBtn` helper uses exact text match to avoid "Save" matching "Save as template"

### Test Coverage
| Feature | Cell Tests | Header Tests |
|---------|-----------|-------------|
| Bold | on/off | on/off |
| Italic | on/off | apply |
| Underline | apply | apply |
| Alignment L/C/R | 3 tests | 3 tests |
| Font Size | apply | apply |
| Borders All/None | 2 tests | 1 test |
| Currency/Percent/Thousands | 3 tests | — |
| Decimal ←/→ | 2 tests | — |
| Clear All | cells | headers + cells |
| Save + Persist | 1 test | — |
| Undo/Redo | 2 tests | — |
| Template Dropdown | 4 tests | — |
| Save As Template | 5 tests | — |
| Template Composition | 2 tests | — |

---

## 10. Monorepo Structure

```
aggrid-customization/
├── packages/
│   ├── core/                    # @grid-customizer/core
│   │   └── src/
│   │       ├── core/            # GridCustomizerCore, EventBus, CssInjector
│   │       ├── expression/      # Tokenizer, Parser, Evaluator, Compiler
│   │       ├── persistence/     # Storage adapters
│   │       ├── modules/         # 18 feature modules
│   │       ├── stores/          # Zustand store factory
│   │       ├── hooks/           # useGridCustomizer, useProfileManager
│   │       ├── ui/              # Settings UI, Shadcn components
│   │       └── types/           # TypeScript interfaces
│   └── markets-grid/            # @grid-customizer/markets-grid
│       └── src/
│           ├── MarketsGrid.tsx   # Drop-in AG-Grid wrapper
│           ├── FormattingToolbar.tsx  # Excel-style toolbar
│           └── renderers/       # Cell renderers
├── apps/demo/                   # Demo app (thin consumer)
├── e2e/                         # Playwright E2E tests (69 tests)
├── playwright.config.ts
└── package.json                 # npm workspaces
```
