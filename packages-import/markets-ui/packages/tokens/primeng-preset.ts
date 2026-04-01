/**
 * MarketsUI PrimeNG Preset
 *
 * Overrides PrimeNG's Aura preset so Angular components visually match
 * the shadcn/React components — same neutral zinc palette, same sizing.
 *
 * Usage in app.config.ts:
 *   import { marketsPreset } from '@marketsui/tokens/primeng-preset';
 *   providePrimeNG({ theme: { preset: marketsPreset, options: { darkModeSelector: '.dark' } } })
 */

import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const marketsPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{zinc.50}",
      100: "{zinc.100}",
      200: "{zinc.200}",
      300: "{zinc.300}",
      400: "{zinc.400}",
      500: "{zinc.500}",
      600: "{zinc.600}",
      700: "{zinc.700}",
      800: "{zinc.800}",
      900: "{zinc.900}",
      950: "{zinc.950}",
    },
    colorScheme: {
      light: {
        primary: {
          color: "{zinc.950}",
          inverseColor: "#ffffff",
          hoverColor: "{zinc.900}",
          activeColor: "{zinc.800}",
        },
        highlight: {
          background: "{zinc.950}",
          focusBackground: "{zinc.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
      dark: {
        primary: {
          color: "{zinc.50}",
          inverseColor: "{zinc.950}",
          hoverColor: "{zinc.100}",
          activeColor: "{zinc.200}",
        },
        highlight: {
          background: "rgba(250, 250, 250, 0.16)",
          focusBackground: "rgba(250, 250, 250, 0.24)",
          color: "rgba(255, 255, 255, 0.87)",
          focusColor: "rgba(255, 255, 255, 0.87)",
        },
      },
    },
  },
});

export default marketsPreset;
