import { themeQuartz } from 'ag-grid-community';

export const fiGridTheme = themeQuartz
  .withParams(
    {
      backgroundColor: '#ffffff',
      foregroundColor: '#1a1a2e',
      headerBackgroundColor: '#f0f1f3',
      headerForegroundColor: '#5f6673',
      oddRowBackgroundColor: '#fafafa',
      rowHoverColor: '#f0f1f3',
      selectedRowBackgroundColor: 'rgba(14,203,129,0.08)',
      borderColor: '#e0e3e7',
      rowBorderColor: 'rgba(224,227,231,0.6)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      headerFontSize: 10,
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
      headerBackgroundColor: '#1e2329',
      headerForegroundColor: '#a0a8b4',
      oddRowBackgroundColor: '#161a1e',
      rowHoverColor: '#1e2329',
      selectedRowBackgroundColor: 'rgba(240,185,11,0.08)',
      borderColor: '#313944',
      rowBorderColor: 'rgba(49,57,68,0.6)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      headerFontSize: 10,
      cellHorizontalPaddingScale: 0.6,
      wrapperBorder: false,
      columnBorder: false,
    },
    'dark',
  );
