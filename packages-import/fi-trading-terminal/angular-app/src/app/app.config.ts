import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeng/themes/aura';
import { generatePrimeNGPreset } from '@design-system/adapters/primeng';

import { routes } from './app.routes';

// Cast to any to bypass strict type checking between the design system adapter
// output and PrimeNG's Preset type (the shapes are compatible at runtime)
const FiTheme = definePreset(Aura, generatePrimeNGPreset() as any);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: FiTheme,
        options: { darkModeSelector: '[data-theme="dark"]' },
      },
    }),
  ],
};
