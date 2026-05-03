import { test, expect } from '@playwright/test';
import { launchPlatform, type PlatformHandle } from '../helpers/launchPlatform';
import { connectViaCDP, listPages } from '../helpers/connectPlaywright';
import type { Browser } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

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
