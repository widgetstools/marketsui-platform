import { test, expect } from '../fixtures/openfin';
import {
  deleteConfigsByOwner,
  listConfigsByOwner,
  type ConfigRowSnapshot,
} from '../helpers/configReader';

/**
 * Parity row 4 — registered-component fields stamped on AppConfigRow.
 *
 * Browser-mode specs cannot exercise this branch: `useHostedIdentity`'s
 * registered-identity resolution only fires when `fin.me.getOptions()`
 * yields `customData.componentType`, which only happens under a real
 * OpenFin runtime. Here we open `test-blotter-a` (customData declares
 * `componentType=MarketsGrid`, `componentSubType=FX`, both `isTemplate`
 * and `singleton` false), trigger a profile save through the real UI,
 * read the resulting AppConfigRow back via the dev-only
 * `window.__configManager` hook, and assert every row carries those
 * four discriminators verbatim.
 *
 * Per-test cleanup deletes every row owned by `(appId=e2e-openfin,
 * userId=e2e-runner)` so a failed run can't poison subsequent runs.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const APP_ID = 'e2e-openfin';
const USER_ID = 'e2e-runner';

test.describe.configure({ mode: 'serial' });

test('storage rows carry registered-component discriminators (parity 4)', async ({ openView }) => {
  test.setTimeout(90_000);

  const page = await openView(VIEW_A);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });

  // Pre-clean any rows left behind by a failed prior run on the same
  // dev box. Rows are scoped by (appId, userId) so this is safe — only
  // touches rows the harness itself wrote.
  await deleteConfigsByOwner(page, { appId: APP_ID, userId: USER_ID });

  // Trigger a profile save through the real ProfileSelector — same
  // surface a user uses, so the storage adapter sees an honest call.
  // Avoids depending on the e2e/helpers/profileHelpers module to keep
  // the e2e-openfin harness self-contained.
  await page.locator('[data-testid="profile-selector-trigger"]').click();
  await expect(page.locator('[data-testid="profile-selector-popover"]')).toBeVisible();
  await page.locator('[data-testid="profile-name-input"]').fill('e2e-test-profile');
  await page.locator('[data-testid="profile-create-btn"]').click();
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    'e2e-test-profile',
  );

  // The save lands asynchronously through the read-modify-write
  // bundle path; poll until at least one row materialises.
  let observed: ConfigRowSnapshot[] = [];
  const start = Date.now();
  while (Date.now() - start < 10_000) {
    observed = await listConfigsByOwner(page, { appId: APP_ID, userId: USER_ID });
    if (observed.length > 0) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  expect(observed.length).toBeGreaterThan(0);

  // Every row must carry the registered-identity stamps from the
  // manifest's customData. The configId is the instanceId — assert it
  // matches the OpenFin customData value to prove the wrap, not a
  // legacy default, drove the discriminator selection.
  for (const row of observed) {
    expect(row.configId).toBe('e2e-openfin-test-a');
    expect(row.appId).toBe(APP_ID);
    expect(row.userId).toBe(USER_ID);
    expect(row.componentType).toBe('MarketsGrid');
    expect(row.componentSubType).toBe('FX');
    expect(row.isTemplate).toBe(false);
    expect(row.singleton).toBe(false);
  }

  // Cleanup — leave the Dexie store in the same shape we found it.
  await deleteConfigsByOwner(page, { appId: APP_ID, userId: USER_ID });
  const after = await listConfigsByOwner(page, { appId: APP_ID, userId: USER_ID });
  expect(after).toHaveLength(0);
});
