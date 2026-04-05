import { bootstrapApplication } from '@angular/platform-browser';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Register AG Grid modules once at app startup — before any component loads
ModuleRegistry.registerModules([AllEnterpriseModule]);
LicenseManager.setLicenseKey('');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
