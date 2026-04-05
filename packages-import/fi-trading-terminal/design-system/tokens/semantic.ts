// ─────────────────────────────────────────────────────────────
//  FI Design System — Semantic Tokens
//  Maps primitives to purpose-driven roles.
//  Each color scheme (dark/light) gets its own mappings.
// ─────────────────────────────────────────────────────────────

import { colors, typography, radius, spacing, opacity, transition } from './primitives';

// ── Color Scheme Type ──
export interface ColorScheme {
  surface: {
    ground:    string;  // page/app background
    primary:   string;  // card/panel background
    secondary: string;  // hover, header background
    tertiary:  string;  // active/pressed, accent bg
  };
  text: {
    primary:   string;  // main body text
    secondary: string;  // labels, descriptions
    muted:     string;  // captions, timestamps
    faint:     string;  // disabled, placeholder
  };
  border: {
    primary:   string;  // panel borders, dividers
    secondary: string;  // interactive borders (inputs, buttons)
  };
  accent: {
    positive:      string;  // buy, gain, success
    positiveHover: string;
    negative:      string;  // sell, loss, error
    negativeHover: string;
    warning:       string;  // caution, pending
    info:          string;  // informational, links
    highlight:     string;  // emphasis, selected
    purple:        string;  // tertiary accent
  };
  action: {
    buyBg:    string;  // buy CTA button background
    buyText:  string;
    sellBg:   string;  // sell CTA button background
    sellText: string;
  };
  scrollbar: string;
}

// ── Dark Scheme ──
export const dark: ColorScheme = {
  surface: {
    ground:    colors.neutral[975],  // #0b0e11
    primary:   colors.neutral[950],  // #161a1e
    secondary: colors.neutral[925],  // #1e2329
    tertiary:  colors.neutral[900],  // #2b3139
  },
  text: {
    primary:   '#eaecef',
    secondary: '#a0a8b4',
    muted:     colors.neutral[500],  // #7a8494
    faint:     colors.neutral[700],  // #4a5568
  },
  border: {
    primary:   colors.neutral[850],  // #313944
    secondary: colors.neutral[800],  // #3e4754
  },
  accent: {
    positive:      colors.teal[400],    // #2dd4bf
    positiveHover: colors.teal[500],    // #14b8a6
    negative:      colors.red[400],     // #f87171
    negativeHover: colors.red[500],     // #ef4444
    warning:       colors.amber[500],   // #f0b90b
    info:          colors.blue[400],    // #3da0ff
    highlight:     colors.cyan[400],    // #22d3ee
    purple:        colors.purple[400],  // #c084fc
  },
  action: {
    buyBg:    colors.teal[600],   // #0d9488
    buyText:  '#ffffff',
    sellBg:   colors.red[600],    // #dc2626
    sellText: '#ffffff',
  },
  scrollbar: colors.neutral[700],
};

// ── Light Scheme ──
export const light: ColorScheme = {
  surface: {
    ground:    colors.neutral[50],   // #f5f5f5
    primary:   colors.neutral[0],    // #ffffff
    secondary: colors.neutral[100],  // #f0f1f3
    tertiary:  colors.neutral[200],  // #e6e8eb
  },
  text: {
    primary:   '#1a1a2e',
    secondary: colors.neutral[600],  // #5f6673
    muted:     colors.neutral[400],  // #9ca3af
    faint:     colors.neutral[300],  // #d1d5db
  },
  border: {
    primary:   '#e0e3e7',
    secondary: colors.neutral[300],  // #d1d5db
  },
  accent: {
    positive:      colors.teal[600],    // #0d9488 (darker for white bg)
    positiveHover: colors.teal[700],    // #0f766e
    negative:      colors.red[600],     // #dc2626
    negativeHover: colors.red[700],     // #b91c1c
    warning:       colors.amber[700],   // #b45309
    info:          colors.blue[600],    // #2563eb
    highlight:     colors.cyan[600],    // #0891b2
    purple:        colors.purple[600],  // #9333ea
  },
  action: {
    buyBg:    colors.teal[600],
    buyText:  '#ffffff',
    sellBg:   colors.red[600],
    sellText: '#ffffff',
  },
  scrollbar: colors.neutral[300],
};

// ── Shared (non-theme-dependent) ──
export const shared = {
  typography,
  radius,
  spacing,
  opacity,
  transition,
} as const;

export const semantic = { dark, light, shared } as const;
