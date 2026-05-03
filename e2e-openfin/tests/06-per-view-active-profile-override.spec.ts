import { test, expect } from '../fixtures/openfin';
import { findPageByUrlSubstring } from '../helpers/connectPlaywright';
import { deleteConfigsByOwner } from '../helpers/configReader';
import type { Browser, Page } from '@playwright/test';

/**
 * Parity §1.13 — per-view active-profile override (OpenFin-only).
 *
 * Closes the zero-coverage gap on `IMPLEMENTED_FEATURES.md §1.13` and the
 * deferred workspace-round-trip manual check on the HostedMarketsGrid
 * worklog. The feature lets duplicated MarketsGrid views show different
 * profiles of the same grid instance and survive workspace save/restore.
 *
 * Two specs:
 *
 *   1. **Round-trip via Platform.getSnapshot / applySnapshot.** Switch a
 *      view to a fresh profile through the real UI, capture the live
 *      platform snapshot, assert the matching view entry's
 *      `customData.activeProfileId` is the new id, then apply the
 *      snapshot back with `closeExistingWindows: true` (mirrors the
 *      workspace-restore path) and confirm the rehydrated view boots
 *      onto the same profile.
 *
 *   2. **Duplicate-view divergence semantics.** Open the source view,
 *      switch profiles, then create a clone via `Platform.createView`
 *      with the same `customData` (including `activeProfileId`). The
 *      clone must boot onto the same profile, then a switch in the clone
 *      must NOT perturb the source — the override lives on each view's
 *      own customData.
 *
 * The active id is read directly from `fin.me.getOptions().customData`,
 * which is what `createOpenFinViewProfileSource()` writes to. We do not
 * inspect ConfigService rows here — §1.13's storage round-trip is the
 * platform snapshot, not Dexie.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const VIEW_A_URL_PART = '/views/test-blotter-a';
const APP_ID = 'e2e-openfin';
const USER_ID = 'e2e-runner';

test.describe.configure({ mode: 'serial' });

test('per-view active-profile id round-trips through Platform snapshot (§1.13)', async ({
  openView,
  platform,
  cdpBrowser,
}) => {
  test.setTimeout(120_000);

  const page = await openView(VIEW_A);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await deleteConfigsByOwner(page, { appId: APP_ID, userId: USER_ID });
  // Re-mount may be needed if the cleanup removed the row this view
  // was already pointed at; the next createProfile drives a fresh row.

  const profileName = 'roundtrip-foo';
  await createProfile(page, profileName);
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    profileName,
    { timeout: 10_000 },
  );

  // The OpenFin pointer source mirrors the active id onto customData on
  // every commit. Reading it back from the live view options is the
  // canonical assertion that the override was written.
  const activeProfileId = await page.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    const opts = await fin.me.getOptions();
    return opts?.customData?.activeProfileId;
  });
  expect(typeof activeProfileId).toBe('string');
  expect(activeProfileId).toBeTruthy();

  // Capture the workspace snapshot. Per §1.13, Platform.getSnapshot()
  // reads from the same view options that updateOptions({ customData })
  // writes, so the per-view override is captured automatically — this
  // is the workspace-save half of the round-trip.
  const snapshot = await page.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    return (await fin.Platform.getCurrentSync().getSnapshot()) as unknown;
  });

  const viewEntry = findViewInSnapshot(snapshot, VIEW_A_URL_PART);
  expect(viewEntry, 'snapshot must contain a view entry for test-blotter-a').toBeTruthy();
  expect(viewEntry?.customData?.activeProfileId).toBe(activeProfileId);

  // Workspace-restore half: apply the snapshot back. closeExistingWindows
  // mirrors the platform-relaunch path — old views close, snapshot views
  // re-open carrying the captured customData (including activeProfileId).
  // Driven from Node because the live page handle dies with its window.
  const platformApi = platform.fin.Platform.getCurrentSync();
  // ApplySnapshotOptions.closeExistingWindows is in OpenFin's runtime API
  // but missing from the node-adapter typings.
  await (platformApi.applySnapshot as unknown as (
    snap: unknown,
    opts?: { closeExistingWindows?: boolean },
  ) => Promise<unknown>)(snapshot, { closeExistingWindows: true });

  const restored = await waitForPageMatchingUrl(cdpBrowser, VIEW_A_URL_PART, 30_000);
  await expect(restored.locator('.ag-root')).toBeVisible({ timeout: 20_000 });

  // The rehydrated view's pointer source reads activeProfileId from
  // customData on boot, so the ProfileManager picks it up before
  // localStorage and the selector reflects the persisted profile.
  await expect(restored.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    profileName,
    { timeout: 15_000 },
  );

  const restoredId = await restored.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    const opts = await fin.me.getOptions();
    return opts?.customData?.activeProfileId;
  });
  expect(restoredId).toBe(activeProfileId);

  await deleteConfigsByOwner(restored, { appId: APP_ID, userId: USER_ID });
});

test('duplicate view inherits source customData then diverges (§1.13 duplicate semantics)', async ({
  openView,
  platform,
  cdpBrowser,
}) => {
  test.setTimeout(120_000);

  const original = await openView(VIEW_A);
  await expect(original.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await deleteConfigsByOwner(original, { appId: APP_ID, userId: USER_ID });

  await createProfile(original, 'dup-source');
  await expect(original.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    'dup-source',
    { timeout: 10_000 },
  );

  const sourceProfileId = (await original.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    const opts = await fin.me.getOptions();
    return opts?.customData?.activeProfileId;
  })) as string;
  expect(sourceProfileId).toBeTruthy();

  // Spawn a clone with duplicated customData. OpenFin's "Duplicate Tab"
  // path inherits customData verbatim — replicating that here exercises
  // the same boot-time read in the cloned view's ProfileManager.
  const cloneName = `e2e-view-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cloneOptions = {
    name: cloneName,
    url: 'http://localhost:5174/views/test-blotter-a',
    customData: {
      instanceId: 'e2e-openfin-test-a',
      appId: APP_ID,
      userId: USER_ID,
      componentType: 'MarketsGrid',
      componentSubType: 'FX',
      isTemplate: false,
      singleton: false,
      activeProfileId: sourceProfileId,
    },
  };
  await (platform.fin.Platform.getCurrentSync().createView as unknown as (
    opts: unknown,
    target?: unknown,
  ) => Promise<unknown>)(cloneOptions, undefined);

  const clone = await waitForPageByViewName(cdpBrowser, cloneName, 20_000);
  await expect(clone.locator('.ag-root')).toBeVisible({ timeout: 20_000 });
  // Clone boots onto the same profile — the override flowed through
  // customData, not through localStorage.
  await expect(clone.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    'dup-source',
    { timeout: 15_000 },
  );

  // Diverge: switch the clone. The override is per-view, so the source
  // must keep its old profile — there is no shared pointer.
  await createProfile(clone, 'dup-clone');
  await expect(clone.locator('[data-testid="profile-selector-trigger"]')).toContainText(
    'dup-clone',
    { timeout: 10_000 },
  );
  // Source remains on its own profile (poll briefly to defeat any
  // accidental cross-view event propagation).
  await expect
    .poll(
      async () => original.locator('[data-testid="profile-selector-trigger"]').textContent(),
      { timeout: 5_000 },
    )
    .toContain('dup-source');

  const sourceIdAfter = await original.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    const opts = await fin.me.getOptions();
    return opts?.customData?.activeProfileId;
  });
  const cloneIdAfter = await clone.evaluate(async () => {
    const fin = (globalThis as unknown as { fin: FinForTest }).fin;
    const opts = await fin.me.getOptions();
    return opts?.customData?.activeProfileId;
  });
  expect(sourceIdAfter).toBe(sourceProfileId);
  expect(cloneIdAfter).toBeTruthy();
  expect(cloneIdAfter).not.toBe(sourceProfileId);

  // Cleanup. The openView fixture only tracks views it opened; the clone
  // was created out-of-band, so destroy it explicitly.
  try {
    await platform.fin.View.wrapSync({
      uuid: platform.platformUuid,
      name: cloneName,
    }).destroy();
  } catch {
    /* already gone */
  }
  await deleteConfigsByOwner(original, { appId: APP_ID, userId: USER_ID });
});

interface FinForTest {
  me: {
    getOptions: () => Promise<{ customData?: { activeProfileId?: string } & Record<string, unknown> }>;
    identity?: { name?: string; uuid?: string };
  };
  Platform: {
    getCurrentSync: () => {
      getSnapshot: () => Promise<unknown>;
    };
  };
}

interface SnapshotViewLike {
  name?: string;
  url?: string;
  customData?: { activeProfileId?: string } & Record<string, unknown>;
}

async function createProfile(page: Page, name: string): Promise<void> {
  await page.locator('[data-testid="profile-selector-trigger"]').click();
  await expect(page.locator('[data-testid="profile-selector-popover"]')).toBeVisible();
  await page.locator('[data-testid="profile-name-input"]').fill(name);
  await page.locator('[data-testid="profile-create-btn"]').click();
  await expect(page.locator('[data-testid="profile-selector-trigger"]')).toContainText(name);
}

function findViewInSnapshot(snapshot: unknown, urlPart: string): SnapshotViewLike | undefined {
  const acc: SnapshotViewLike[] = [];
  walkSnapshot(snapshot, acc);
  return acc.find((v) => typeof v.url === 'string' && v.url.includes(urlPart));
}

function walkSnapshot(node: unknown, acc: SnapshotViewLike[]): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown> & SnapshotViewLike;
  if (typeof n.name === 'string' && typeof n.url === 'string') acc.push(n);
  for (const v of (n.views as unknown[]) ?? []) walkSnapshot(v, acc);
  for (const w of (n.windows as unknown[]) ?? []) walkSnapshot(w, acc);
  for (const c of (n.children as unknown[]) ?? []) walkSnapshot(c, acc);
  if (n.layout && typeof n.layout === 'object') walkSnapshot(n.layout, acc);
  for (const c of (n.content as unknown[]) ?? []) walkSnapshot(c, acc);
}

async function waitForPageMatchingUrl(
  browser: Browser,
  urlPart: string,
  timeoutMs: number,
): Promise<Page> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const page = await findPageByUrlSubstring(browser, urlPart);
    if (page && !page.isClosed()) return page;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No page matching ${urlPart} appeared within ${timeoutMs}ms`);
}

async function waitForPageByViewName(
  browser: Browser,
  viewName: string,
  timeoutMs: number,
): Promise<Page> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const ctx of browser.contexts()) {
      for (const page of ctx.pages()) {
        if (page.isClosed()) continue;
        try {
          const name = await page.evaluate(
            () => (globalThis as unknown as { fin?: FinForTest }).fin?.me?.identity?.name,
          );
          if (name === viewName) return page;
        } catch {
          /* page may not have fin yet */
        }
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No view named ${viewName} appeared within ${timeoutMs}ms`);
}
