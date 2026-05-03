import { test, expect } from '../fixtures/openfin';

const VIEW = 'http://localhost:5174/views/test-blotter-a.fin.json';

test.describe.configure({ mode: 'serial' });

test('smoke — view boots and grid renders', async ({ openView }) => {
  test.setTimeout(60_000);

  const page = await openView(VIEW);
  await expect(page.locator('.ag-root')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.ag-row').first()).toBeVisible({ timeout: 15_000 });
});
