import { themeQuartz } from 'ag-grid-community';

/**
 * FI Design System AG Grid theme — simplified version that avoids
 * deprecated/removed params in ag-grid-community v35.
 */
export const fiGridTheme = themeQuartz
  .withParams(
    {
      backgroundColor: '#ffffff',
      foregroundColor: '#1a1a2e',
      oddRowBackgroundColor: '#fafafa',
      borderColor: '#e0e3e7',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      cellHorizontalPaddingScale: 0.6,
      wrapperBorder: false,
      columnBorder: false,
    },
    'light',
  )
  .withParams(
    {
      backgroundColor: '#161a1e',
      foregroundColor: '#eaecef',
      oddRowBackgroundColor: '#161a1e',
      borderColor: '#313944',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      cellHorizontalPaddingScale: 0.6,
      wrapperBorder: false,
      columnBorder: false,
    },
    'dark',
  );
