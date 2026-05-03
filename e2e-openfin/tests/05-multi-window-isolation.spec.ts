import { test, expect } from '../fixtures/openfin';
import {
  deleteConfigsByOwner,
  listConfigsByOwner,
  readGridLevelLiveProviderId,
  setGridLevelLiveProviderId,
} from '../helpers/configReader';

/**
 * Parity row 18 — grid-level provider persistence isolated per
 * `customData.instanceId`.
 *
 * Browser-mode specs cannot exercise this branch: a browser tab maps
 * 1:1 to a route, so there is no second view to perturb. Under
 * OpenFin, two views with distinct `customData.instanceId` resolve to
 * two distinct `configId` rows; a write under one MUST NOT touch the
 * other. This spec opens `test-blotter-a` and `test-blotter-b` in the
 * same platform, seeds each row through the real profile-create UI
 * (so the registered-identity wrap stamps the discriminators
 * end-to-end), then writes a different `gridLevelData.liveProviderId`
 * to each. Reads via `__configManager` confirm both rows hold their
 * own value and neither leaked.
 *
 * `setGridLevelLiveProviderId` does the read-modify-write that the
 * production `createConfigServiceStorage.saveGridLevelData` does —
 * not driven through the picker UI because the reference app does
 * not seed any data-provider rows for the picker to surface. The
 * isolation invariant under test is the row-keying behaviour, not
 * the picker click; surfacing the picker is already covered by the
 * Alt+Shift+P chord spec in `e2e/hosted-markets-grid.spec.ts`, and
 * session 10 re-runs the chord under OpenFin.
 *
 * Replaces the deferred manual check from
 * `docs/HOSTED_MARKETS_GRID_REFACTOR_WORKLOG.md` session 10 step 3.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const VIEW_B = 'http://localhost:5174/views/test-blotter-b.fin.json';
const INSTANCE_A = 'e2e-openfin-test-a';
const INSTANCE_B = 'e2e-openfin-test-b';
const APP_ID = 'e2e-openfin';
const USER_ID = 'e2e-runner';

test.describe.configure({ mode: 'serial' });

test('grid-level provider selection is isolated per instanceId (parity 18)', async ({ openView }) => {
  test.setTimeout(120_000);

  const pageA = await openView(VIEW_A);
  const pageB = await openView(VIEW_B);

  await Promise.all([
    expect(pageA.locator('.ag-root')).toBeVisible({ timeout: 15_000 }),
    expect(pageB.locator('.ag-root')).toBeVisible({ timeout: 15_000 }),
  ]);

  // Pre-clean. Either page can drive the cleanup — both share the
  // same Dexie database via the appId/userId scope.
  await deleteConfigsByOwner(pageA, { appId: APP_ID, userId: USER_ID });

  // Seed each row by creating a profile in its own view. This goes
  // through the registered-identity wrap, so the resulting row has
  // the four discriminators session 7 already validates.
  await createProfile(pageA, 'iso-A');
  await createProfile(pageB, 'iso-B');

  // Wait for both rows to materialise — saves are async through the
  // read-modify-write bundle path.
  await expect
    .poll(async () => (await listConfigsByOwner(pageA, { appId: APP_ID, userId: USER_ID })).length, {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(2);

  // Write a distinct liveProviderId to each row through the same
  // read-modify-write semantics the storage adapter uses internally.
  await setGridLevelLiveProviderId(pageA, INSTANCE_A, 'dp-isolated-a');
  await setGridLevelLiveProviderId(pageB, INSTANCE_B, 'dp-isolated-b');

  // Crucial isolation assertion: reading either row sees only its own
  // value. The cross-page read (e.g. reading B's row from page A)
  // confirms the rows truly share a backing store and the keying is
  // doing the work, not page-local state.
  expect(await readGridLevelLiveProviderId(pageA, INSTANCE_A)).toBe('dp-isolated-a');
  expect(await readGridLevelLiveProviderId(pageA, INSTANCE_B)).toBe('dp-isolated-b');
  expect(await readGridLevelLiveProviderId(pageB, INSTANCE_A)).toBe('dp-isolated-a');
  expect(await readGridLevelLiveProviderId(pageB, INSTANCE_B)).toBe('dp-isolated-b');

  // And the negative form: writing A did not perturb B (and vice versa).
  expect(await readGridLevelLiveProviderId(pageA, INSTANCE_A)).not.toBe(
    await readGridLevelLiveProviderId(pageA, INSTANCE_B),
  );

  // Cleanup.
  await deleteConfigsByOwner(pageA, { appId: APP_ID, userId: USER_ID });
  expect(await listConfigsByOwner(pageA, { appId: APP_ID, userId: USER_ID })).toHaveLength(0);
});

async function createProfile(page: import('@playwright/test').Page, name: string): Promise<void> {
  await page.locator('[data-testid="profile-selector-trigger"]').click();
  await expect(page.locator('[data-testid="profile-selector-popover"]')).toBeVisible();
  await page.locator('[data-testid="profile-name-input"]').fill(name);
  await page.locator('[data-testid="profile-create-btn"]').click();
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toContainText(name);
}
