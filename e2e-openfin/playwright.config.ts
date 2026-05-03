import { defineConfig } from '@playwright/test';

// Attach mode: assume the user already runs `npm run dev:openfin:markets-react`
// in another terminal, and just attach via CDP. Skip Vite + RVM lifecycle.
const ATTACH = process.env.OPENFIN_ATTACH === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  // Per-test timeout: RVM cold-start + manifest fetch + view-appear can stack
  // against a slow first run. 240s mirrors the worker-fixture launch budget.
  timeout: 240_000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [{ name: 'openfin' }],
  webServer: ATTACH ? undefined : [
    {
      // Spawn Vite directly (not through `npm run dev`) so Playwright's
      // child-handle kill on Windows doesn't leave a Vite grandchild
      // orphan holding port 5174. Use the manifest's own host (`localhost`)
      // so OpenFin's security-realm origin matching doesn't reject the
      // manifest's internal URLs as cross-origin.
      // `url` (not `port`) waits for HTTP readiness, not just TCP listen.
      command: 'npx vite --port 5174 --strictPort',
      cwd: '../apps/markets-ui-react-reference',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
