import { test, expect } from '@playwright/test';
import { launchPlatform, type PlatformHandle } from '../helpers/launchPlatform';
import { connectViaCDP, listPages } from '../helpers/connectPlaywright';
import type { Browser } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// In attach mode, the user owns the runtime — there's nothing to launch
// or quit, so this self-contained launch/quit smoke is meaningless.
test.skip(
  process.env.OPENFIN_ATTACH === '1',
  'attach mode: harness does not own runtime lifecycle',
);

test('cdp-attach — Playwright connects to OpenFin runtime and enumerates pages', async () => {
  test.setTimeout(60_000);

  let platform: PlatformHandle | undefined;
  let browser: Browser | undefined;
  try {
    platform = await launchPlatform();
    expect(platform.debugPort).toBe(9090);

    browser = await connectViaCDP(platform.debugPort);

    const contexts = browser.contexts();
    expect(contexts.length).toBeGreaterThan(0);

    const pages = listPages(browser);
    expect(pages.length).toBeGreaterThan(0);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore — runtime may already be torn down */
      }
    }
    if (platform) {
      await platform.quit();
    }
  }
});
