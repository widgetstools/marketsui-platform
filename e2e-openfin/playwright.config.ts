import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [{ name: 'openfin' }],
  webServer: [
    {
      command: 'npm run dev -w @marketsui/markets-ui-react-reference',
      port: 5174,
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],
});
