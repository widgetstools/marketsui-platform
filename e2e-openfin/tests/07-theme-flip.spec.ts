import { test, expect } from '../fixtures/openfin';
import type { Page } from '@playwright/test';

/**
 * Parity row 12 — theme switching driven by `[data-theme]` and the
 * IAB theme broadcast.
 *
 * Browser-mode `e2e/hosted-markets-grid.spec.ts` flips theme by writing
 * `localStorage.theme` and reloading — that path proves the
 * ThemeProvider boot-time read but never exercises the IAB
 * subscription, which is the only mechanism that propagates a dock
 * theme toggle across windows under OpenFin.
 *
 * Reference app's `ThemeProvider` (`apps/markets-ui-react-reference/src/
 * context/ThemeContext.tsx`) subscribes to IAB topic `'theme-changed'`
 * with payload `{ isDark }` and writes `[data-theme]` + `data-ag-theme-
 * mode` on every flip. The dock publishes this topic on its theme
 * toggle (see `packages/openfin-platform/src/iab-topics.ts ::
 * IAB_THEME_CHANGED`); we mimic that publish from a page inside the
 * platform — publishing from any view reaches every subscribing view
 * because the subscription scopes by `me.identity.uuid` (the platform
 * UUID), which all views share.
 *
 * Two tests:
 *   1. **Single-view IAB flip** — publish `{ isDark: false }`, assert
 *      `[data-theme]` flips to `light` and the AG-Grid background colour
 *      observably changes. Mirrors the browser theme test's assertions
 *      while exercising the IAB code path instead of localStorage+reload.
 *   2. **Cross-view broadcast** — open A and B, publish from A, both
 *      views' `[data-theme]` flip together. The browser harness has
 *      only one focus model so cannot express this — it is the
 *      OpenFin-specific assertion.
 *
 * Cleanup: after each test, broadcast back to dark and clear the
 * `theme` localStorage key on every open page so a downstream test
 * inherits a clean dark default.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const VIEW_B = 'http://localhost:5174/views/test-blotter-b.fin.json';
const IAB_THEME_CHANGED = 'theme-changed';

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({ cdpBrowser }) => {
  for (const ctx of cdpBrowser.contexts()) {
    for (const p of ctx.pages()) {
      if (p.isClosed()) continue;
      try {
        await p.evaluate(async (topic) => {
          const fin = (globalThis as unknown as { fin?: FinForTest }).fin;
          if (fin?.InterApplicationBus) {
            try {
              await fin.InterApplicationBus.publish(topic, { isDark: true });
            } catch {
              /* ignore */
            }
          }
          try {
            window.localStorage.removeItem('theme');
          } catch {
            /* ignore */
          }
        }, IAB_THEME_CHANGED);
      } catch {
        /* page may have closed by the time afterEach runs */
      }
    }
  }
});

test('IAB theme broadcast flips data-theme on a single view (parity 12)', async ({ openView }) => {
  test.setTimeout(120_000);

  const page = await openView(VIEW_A);
  await waitForGrid(page);

  // Boot default is dark — ThemeProvider falls through to `'dark'`
  // when localStorage has no `theme` key.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 });

  const darkBg = await readGridBg(page);
  expect(darkBg).not.toBe('');

  // Publish from inside the platform — the ThemeProvider subscribes to
  // publishes from `me.identity.uuid`, which equals the publishing
  // page's uuid (both are the platform UUID).
  await publishTheme(page, false);

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 10_000 });

  const lightBg = await readGridBg(page);
  expect(lightBg).not.toBe('');
  expect(lightBg).not.toBe(darkBg);
});

test('IAB theme broadcast reaches all platform views (parity 12, OpenFin-only)', async ({
  openView,
}) => {
  test.setTimeout(120_000);

  const pageA = await openView(VIEW_A);
  const pageB = await openView(VIEW_B);
  await Promise.all([waitForGrid(pageA), waitForGrid(pageB)]);

  await Promise.all([
    expect(pageA.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 }),
    expect(pageB.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 }),
  ]);

  // Publish from A — the broadcast must reach B as well, because every
  // view in the platform subscribes under the same platform UUID.
  await publishTheme(pageA, false);

  await Promise.all([
    expect(pageA.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 10_000 }),
    expect(pageB.locator('html')).toHaveAttribute('data-theme', 'light', { timeout: 10_000 }),
  ]);

  // Round-trip the other direction so we confirm both flips work, not
  // just the dark→light edge.
  await publishTheme(pageB, true);

  await Promise.all([
    expect(pageA.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 }),
    expect(pageB.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 10_000 }),
  ]);
});

interface FinForTest {
  InterApplicationBus: {
    publish: (topic: string, message: unknown) => Promise<void>;
  };
}

async function waitForGrid(page: Page): Promise<void> {
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function readGridBg(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('.ag-root-wrapper') as HTMLElement | null;
    return el ? getComputedStyle(el).backgroundColor : '';
  });
}

async function publishTheme(page: Page, isDark: boolean): Promise<void> {
  await page.evaluate(
    async ({ topic, payload }) => {
      const fin = (globalThis as unknown as { fin: FinForTest }).fin;
      await fin.InterApplicationBus.publish(topic, payload);
    },
    { topic: IAB_THEME_CHANGED, payload: { isDark } },
  );
}
