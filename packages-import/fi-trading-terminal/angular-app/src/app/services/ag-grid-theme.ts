// AG Grid theme for the Angular app.
// Defined locally to ensure themeQuartz comes from the SAME ag-grid-community
// instance as ag-grid-angular (avoids cross-project module resolution issues).

import { themeQuartz } from 'ag-grid-community';

const lightParams: Record<string, unknown> = {
  backgroundColor:           '#faf8f5',
  foregroundColor:           '#1c1917',
  headerBackgroundColor:     '#efece6',
  headerForegroundColor:     '#44403c',
  oddRowBackgroundColor:     '#f6f4f0',
  rowHoverColor:             '#efece6',
  selectedRowBackgroundColor:'rgba(14,203,129,0.08)',
  borderColor:               '#d6d3cd',
  rowBorderColor:            '#d6d3cd99',
  fontFamily:                "'JetBrains Mono', monospace",
  fontSize:                  11,
  headerFontSize:            10,
  cellHorizontalPaddingScale: 0.6,
  wrapperBorder:             false,
  columnBorder:              false,
};

const darkParams: Record<string, unknown> = {
  backgroundColor:           '#161a1e',
  foregroundColor:           '#eaecef',
  headerBackgroundColor:     '#1e2329',
  headerForegroundColor:     '#a0a8b4',
  oddRowBackgroundColor:     '#161a1e',
  rowHoverColor:             '#1e2329',
  selectedRowBackgroundColor:'rgba(240,185,11,0.08)',
  borderColor:               '#313944',
  rowBorderColor:            '#31394499',
  fontFamily:                "'JetBrains Mono', monospace",
  fontSize:                  11,
  headerFontSize:            10,
  cellHorizontalPaddingScale: 0.6,
  wrapperBorder:             false,
  columnBorder:              false,
};

export const fiGridTheme = themeQuartz
  .withParams(lightParams as any, 'light')
  .withParams(darkParams as any, 'dark');
