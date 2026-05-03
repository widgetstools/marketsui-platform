import { test, expect } from '../fixtures/openfin';
import type { Page } from '@playwright/test';

/**
 * Parity row 16 — Alt+Shift+P provider-picker chord under OpenFin.
 *
 * The browser e2e (`e2e/hosted-markets-grid.spec.ts`) covers the chord
 * for a single page. Re-running it under OpenFin guards the runtime's
 * keyboard-event delivery to the active view (CDP routes `Input.
 * dispatchKeyEvent` to the targeted page, so this is a real check that
 * OpenFin's view focus model receives keystrokes the same way Chrome
 * does in browser mode).
 *
 * The OpenFin-specific assertion is the **two-views isolation case**:
 * with A and B both open, pressing the chord targeting A's page must
 * mount the picker in A only — B's picker stays hidden. The browser
 * harness can't express this (one focus model, one tab); only an
 * OpenFin runtime exposes the per-view focus boundary.
 *
 * The picker mounts the ProviderToolbar strip with `Live` and `Hist`
 * buttons (per `e2e/hosted-markets-grid.spec.ts:102`); we use those
 * same selectors so the cross-harness contract is explicit.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const VIEW_B = 'http://localhost:5174/views/test-blotter-b.fin.json';

test.describe.configure({ mode: 'serial' });

test('Alt+Shift+P toggles the provider picker on a single view (parity 16)', async ({
  openView,
}) => {
  test.setTimeout(120_000);

  const page = await openView(VIEW_A);
  await waitForGrid(page);

  const liveBtn = page.locator('button', { hasText: /^Live$/ }).first();
  const histBtn = page.locator('button', { hasText: /^Hist$/ }).first();
  await expect(liveBtn).toHaveCount(0);

  await pressProviderChord(page);

  await expect(liveBtn).toBeVisible({ timeout: 5_000 });
  await expect(histBtn).toBeVisible({ timeout: 5_000 });
});

test('Alt+Shift+P only toggles the focused view (parity 16, OpenFin-only)', async ({
  openView,
}) => {
  test.setTimeout(120_000);

  const pageA = await openView(VIEW_A);
  const pageB = await openView(VIEW_B);
  await Promise.all([waitForGrid(pageA), waitForGrid(pageB)]);

  const liveA = pageA.locator('button', { hasText: /^Live$/ }).first();
  const liveB = pageB.locator('button', { hasText: /^Live$/ }).first();
  await expect(liveA).toHaveCount(0);
  await expect(liveB).toHaveCount(0);

  // CDP routes keyboard events to the targeted Page's CDP session, so
  // dispatching the chord on `pageA` only delivers it to A's view —
  // this is the OpenFin focus-isolation property under test.
  await pressProviderChord(pageA);

  await expect(liveA).toBeVisible({ timeout: 5_000 });
  // B must NOT have toggled. Use a short positive wait to defeat any
  // accidental cross-view event propagation that could lag a tick or
  // two behind A's mount.
  await pageB.waitForTimeout(500);
  await expect(liveB).toHaveCount(0);

  // Now press on B — A stays open (the chord is per-view-latched, not
  // a global toggle), B mounts its own picker.
  await pressProviderChord(pageB);

  await expect(liveB).toBeVisible({ timeout: 5_000 });
  await expect(liveA).toBeVisible();
});

async function waitForGrid(page: Page): Promise<void> {
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toBeVisible({
    timeout: 15_000,
  });
}

async function pressProviderChord(page: Page): Promise<void> {
  // Mirror the browser e2e chord (down/down/press/up/up) so any
  // platform-side handler that latches on Alt+Shift modifiers sees the
  // same key sequence in either harness.
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyP');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
}
