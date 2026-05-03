import { test, expect } from '../fixtures/openfin';

/**
 * Parity rows 1, 3, 21 — the OpenFin identity branch of useHostedIdentity
 * is never exercised under browser-mode specs (only mocked). These specs
 * drive it through the real runtime: fin.me.getOptions() is read, the
 * wrapper sets document.title from the resolved componentName, and the
 * toolbar info popover surfaces the OpenFin-derived instanceId.
 *
 * The popover renders `componentName` (header) + path/instanceId/gridId/
 * appId/userId rows — `componentType` is *not* surfaced today (it lives
 * on AppConfigRow, not the toolbar), so this spec asserts the values the
 * popover actually exposes. Coverage of `componentType` reaching storage
 * is session 7's job.
 */

const VIEW_A = 'http://localhost:5174/views/test-blotter-a.fin.json';
const VIEW_TEMPLATE = 'http://localhost:5174/views/test-blotter-template.fin.json';

test.describe.configure({ mode: 'serial' });

test('customData identity — instanceId reaches the wrapper', async ({ openView }) => {
  test.setTimeout(60_000);

  const page = await openView(VIEW_A);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });

  const opts = await page.evaluate(async () => {
    return (globalThis as unknown as { fin: { me: { getOptions: () => Promise<unknown> } } })
      .fin.me.getOptions();
  });

  const customData = (opts as { customData: Record<string, unknown> }).customData;
  expect(customData.instanceId).toBe('e2e-openfin-test-a');
  expect(customData.appId).toBe('e2e-openfin');
  expect(customData.componentType).toBe('MarketsGrid');
  expect(customData.componentSubType).toBe('FX');
  expect(customData.isTemplate).toBe(false);
  expect(customData.singleton).toBe(false);

  // BlottersMarketsGrid passes documentTitle="MarketsGrid · Blotter";
  // the wrapper effect copies it to document.title on mount.
  await expect.poll(async () => page.title(), { timeout: 5_000 }).toContain('MarketsGrid');
});

test('toolbar info popover surfaces componentName + OpenFin instanceId', async ({ openView }) => {
  test.setTimeout(60_000);

  const page = await openView(VIEW_A);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await page.locator('[data-testid="grid-info-btn"]').click();

  const popover = page.locator('[data-gc-settings]').filter({ hasText: 'instanceId' });
  await expect(popover).toBeVisible();
  // componentName header — same string the wrapper passes through.
  await expect(popover).toContainText('MarketsGrid');
  // OpenFin customData.instanceId wins over defaultInstanceId in OpenFin context.
  await expect(popover).toContainText('e2e-openfin-test-a');
});

test('template manifest — isTemplate + singleton flags reach customData', async ({ openView }) => {
  test.setTimeout(60_000);

  const page = await openView(VIEW_TEMPLATE);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });

  const opts = await page.evaluate(async () => {
    return (globalThis as unknown as { fin: { me: { getOptions: () => Promise<unknown> } } })
      .fin.me.getOptions();
  });

  const customData = (opts as { customData: Record<string, unknown> }).customData;
  expect(customData.instanceId).toBe('e2e-openfin-template');
  expect(customData.isTemplate).toBe(true);
  expect(customData.singleton).toBe(true);
});
