// ─────────────────────────────────────────────────────────────
//  FI Design System — PrimeNG Adapter
//  Generates a preset config object compatible with
//  definePreset(Aura, config) in Angular PrimeNG v19+.
//  Import this in your Angular app's providePrimeNG() config.
// ─────────────────────────────────────────────────────────────

import { colors, typography, radius } from '../tokens/primitives';
import { dark, light } from '../tokens/semantic';
import { componentTokens } from '../tokens/components';

/**
 * Generate the PrimeNG preset override object.
 * Usage in Angular:
 *
 * ```typescript
 * import { definePreset } from 'primeng/api';
 * import { Aura } from 'primeng/themes';
 * import { generatePrimeNGPreset } from '@fi-design-system/adapters/primeng';
 *
 * const FiTheme = definePreset(Aura, generatePrimeNGPreset());
 *
 * providePrimeNG({
 *   theme: {
 *     preset: FiTheme,
 *     options: { darkModeSelector: '[data-theme="dark"]' }
 *   }
 * })
 * ```
 */
export function generatePrimeNGPreset() {
  const darkComp = componentTokens(dark);
  const lightComp = componentTokens(light);

  return {
    // ── Primitive overrides ──
    primitive: {
      borderRadius: {
        none: radius.none,
        xs:   radius.sm,
        sm:   radius.md,
        md:   radius.lg,
        lg:   radius.xl,
        xl:   '8px',
      },
    },

    // ── Semantic overrides ──
    semantic: {
      // Map teal scale → primary (buy/positive is the brand action color)
      primary: {
        50:  colors.teal[50],
        100: colors.teal[100],
        200: colors.teal[200],
        300: colors.teal[300],
        400: colors.teal[400],
        500: colors.teal[500],
        600: colors.teal[600],
        700: colors.teal[700],
        800: colors.teal[800],
        900: colors.teal[900],
      },
      // Status colors
      success: { 500: colors.teal[500] },
      warning: { 500: colors.amber[500] },
      danger:  { 500: colors.red[500] },
      info:    { 500: colors.blue[500] },

      // Font
      fontFamily: typography.fontFamily.sans,

      // Per-scheme surface and text
      colorScheme: {
        light: {
          surface: {
            0:   light.surface.primary,
            50:  light.surface.ground,
            100: light.surface.secondary,
            200: light.surface.tertiary,
            300: colors.neutral[300],
            400: colors.neutral[400],
            500: colors.neutral[500],
            600: colors.neutral[600],
            700: colors.neutral[700],
            800: colors.neutral[800],
            900: colors.neutral[900],
            950: colors.neutral[950],
          },
          primary: {
            color:         light.accent.positive,
            contrastColor: light.action.buyText,
            hoverColor:    light.accent.positiveHover,
            activeColor:   colors.teal[800],
          },
          text: {
            color:          light.text.primary,
            hoverColor:     light.text.primary,
            mutedColor:     light.text.muted,
            hoverMutedColor:light.text.secondary,
          },
          content: {
            background:  light.surface.primary,
            hoverBackground: light.surface.secondary,
            borderColor: light.border.primary,
            color:       light.text.primary,
            hoverColor:  light.text.primary,
          },
          formField: {
            background:     light.surface.primary,
            disabledBackground: light.surface.secondary,
            filledBackground:   light.surface.secondary,
            borderColor:    light.border.secondary,
            hoverBorderColor: light.accent.info,
            focusBorderColor: light.accent.warning,
            color:          light.text.primary,
            disabledColor:  light.text.faint,
            placeholderColor: light.text.muted,
          },
        },
        dark: {
          surface: {
            0:   dark.surface.ground,
            50:  dark.surface.primary,
            100: dark.surface.secondary,
            200: dark.surface.tertiary,
            300: colors.neutral[800],
            400: colors.neutral[700],
            500: colors.neutral[600],
            600: colors.neutral[500],
            700: colors.neutral[400],
            800: colors.neutral[300],
            900: colors.neutral[200],
            950: colors.neutral[100],
          },
          primary: {
            color:         dark.accent.positive,
            contrastColor: dark.action.buyText,
            hoverColor:    dark.accent.positiveHover,
            activeColor:   colors.teal[300],
          },
          text: {
            color:          dark.text.primary,
            hoverColor:     dark.text.primary,
            mutedColor:     dark.text.muted,
            hoverMutedColor:dark.text.secondary,
          },
          content: {
            background:  dark.surface.primary,
            hoverBackground: dark.surface.secondary,
            borderColor: dark.border.primary,
            color:       dark.text.primary,
            hoverColor:  dark.text.primary,
          },
          formField: {
            background:     'transparent',
            disabledBackground: dark.surface.secondary,
            filledBackground:   dark.surface.tertiary,
            borderColor:    dark.border.secondary,
            hoverBorderColor: dark.accent.info,
            focusBorderColor: dark.accent.warning,
            color:          dark.text.primary,
            disabledColor:  dark.text.faint,
            placeholderColor: dark.text.muted,
          },
        },
      },
    },

    // ── Component overrides ──
    components: {
      button: {
        borderRadius:  darkComp.button.borderRadius,
        paddingX:      darkComp.button.paddingX,
        paddingY:      darkComp.button.paddingY,
        fontWeight:    String(darkComp.button.fontWeight),
      },
      inputtext: {
        borderRadius:  darkComp.input.borderRadius,
        paddingX:      darkComp.input.paddingX,
        paddingY:      darkComp.input.paddingY,
      },
      datatable: {
        headerCellPadding: `${darkComp.table.cellPaddingY} ${darkComp.table.cellPaddingX}`,
        bodyCellPadding:   `${darkComp.table.cellPaddingY} ${darkComp.table.cellPaddingX}`,
      },
      tab: {
        activeBorderColor: dark.accent.warning,
      },
    },
  };
}
