// ─────────────────────────────────────────────────────────────
//  FI Design System — AG Grid Adapter
//  Generates themeQuartz.withParams() config for light + dark.
//  Works identically in React (ag-grid-react) and Angular
//  (ag-grid-angular) — same API, same params.
// ─────────────────────────────────────────────────────────────

import { themeQuartz } from 'ag-grid-community';
import { dark, light, shared } from '../tokens/semantic';
import { componentTokens } from '../tokens/components';

/**
 * Generate the AG Grid theme with light and dark mode params.
 *
 * Usage (React):
 * ```tsx
 * import { fiGridTheme } from '@fi-design-system/adapters/ag-grid';
 * <AgGridReact theme={fiGridTheme} ... />
 * ```
 *
 * Usage (Angular):
 * ```typescript
 * import { fiGridTheme } from '@fi-design-system/adapters/ag-grid';
 * @Component({ template: '<ag-grid-angular [theme]="theme" />' })
 * export class MyGrid { theme = fiGridTheme; }
 * ```
 */
export const fiGridTheme = themeQuartz
  .withParams(
    {
      backgroundColor:          light.surface.primary,
      foregroundColor:          light.text.primary,
      headerBackgroundColor:    light.surface.secondary,
      headerForegroundColor:    light.text.secondary,
      oddRowBackgroundColor:    '#fafafa',
      rowHoverColor:            light.surface.secondary,
      selectedRowBackgroundColor: 'rgba(14,203,129,0.08)',
      borderColor:              light.border.primary,
      rowBorderColor:           `${light.border.primary}99`,
      fontFamily:               shared.typography.fontFamily.mono,
      fontSize:                 parseInt(shared.typography.fontSize.sm),
      headerFontSize:           parseInt(shared.typography.fontSize.xs) + 1, // 10px
      cellHorizontalPaddingScale: 0.6,
      wrapperBorder:            false,
      columnBorder:             false,
    },
    'light',
  )
  .withParams(
    {
      backgroundColor:          dark.surface.primary,
      foregroundColor:          dark.text.primary,
      headerBackgroundColor:    dark.surface.secondary,
      headerForegroundColor:    dark.text.secondary,
      oddRowBackgroundColor:    dark.surface.primary,
      rowHoverColor:            dark.surface.secondary,
      selectedRowBackgroundColor: `${dark.accent.warning}14`, // 8% opacity
      borderColor:              dark.border.primary,
      rowBorderColor:           `${dark.border.primary}99`,
      fontFamily:               shared.typography.fontFamily.mono,
      fontSize:                 parseInt(shared.typography.fontSize.sm),
      headerFontSize:           parseInt(shared.typography.fontSize.xs) + 1, // 10px
      cellHorizontalPaddingScale: 0.6,
      wrapperBorder:            false,
      columnBorder:             false,
    },
    'dark',
  );
