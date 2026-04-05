// ─────────────────────────────────────────────────────────────
//  FI Design System — Primitive Tokens
//  Raw palette, type scale, spacing, radius, opacity, timing.
//  No semantic meaning — just values.
// ─────────────────────────────────────────────────────────────

export const colors = {
  neutral: {
    0:   '#ffffff',
    50:  '#f5f5f5',
    100: '#f0f1f3',
    200: '#e6e8eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#7a8494',
    600: '#5f6673',
    700: '#4a5568',
    800: '#3e4754',
    850: '#313944',
    900: '#2b3139',
    925: '#1e2329',
    950: '#161a1e',
    975: '#0b0e11',
  },
  teal: {
    50:  '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  red: {
    50:  '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  amber: {
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f0b90b',
    600: '#d97706',
    700: '#b45309',
  },
  blue: {
    300: '#93c5fd',
    400: '#3da0ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  cyan: {
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
  },
  purple: {
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
  },
} as const;

export const typography = {
  fontFamily: {
    mono: "'JetBrains Mono', monospace",
    sans: "'Geist', sans-serif",
  },
  fontSize: {
    xs: '9px',   // column headers, badges, timestamps, captions
    sm: '11px',  // body text, table cells, data values (DEFAULT)
    md: '13px',  // section titles, nav tabs, CTA buttons
    lg: '18px',  // KPI headline numbers
  },
  fontWeight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  letterSpacing: {
    tight:  '0.02em',
    normal: '0.03em',
    wide:   '0.04em',
    wider:  '0.05em',
  },
  lineHeight: {
    none:    1,
    tight:   1.25,
    normal:  1.5,
    relaxed: 1.8,
  },
} as const;

export const spacing = {
  0:  0,
  px: 1,
  0.5: 2,
  1:  4,
  1.5: 6,
  2:  8,
  2.5: 10,
  3:  12,
  3.5: 14,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
} as const;

export const radius = {
  none: '0px',
  sm:   '2px',
  md:   '3px',
  lg:   '4px',
  xl:   '6px',
  full: '9999px',
} as const;

export const opacity = {
  muted:  0.06,
  subtle: 0.08,
  light:  0.12,
  medium: 0.25,
  heavy:  0.35,
  solid:  1.0,
} as const;

export const transition = {
  fast:   '150ms ease',
  normal: '200ms ease',
  slow:   '500ms ease-out',
} as const;

export const shadow = {
  none: 'none',
  sm:   '0 1px 2px rgba(0,0,0,0.15)',
  md:   '0 2px 6px rgba(0,0,0,0.2)',
  lg:   '0 4px 12px rgba(0,0,0,0.25)',
} as const;

export const primitives = {
  colors,
  typography,
  spacing,
  radius,
  opacity,
  transition,
  shadow,
} as const;
