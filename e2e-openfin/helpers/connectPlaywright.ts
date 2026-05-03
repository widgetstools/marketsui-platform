import { chromium, type Browser, type Page } from '@playwright/test';

export async function connectViaCDP(debugPort = 9090): Promise<Browser> {
  try {
    return await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not attach Playwright via CDP at http://127.0.0.1:${debugPort}. ` +
        `Is the OpenFin runtime running with --remote-debugging-port=${debugPort}? ` +
        `Underlying error: ${msg}`,
    );
  }
}

export async function findPageByUrlSubstring(
  browser: Browser,
  urlPart: string,
): Promise<Page | null> {
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (page.url().includes(urlPart)) return page;
    }
  }
  return null;
}

export function listPages(browser: Browser): Page[] {
  const pages: Page[] = [];
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) pages.push(page);
  }
  return pages;
}

/**
 * Find any page that has the OpenFin `fin` API available — used in attach
 * mode where we drive `Platform.createView` from a page rather than Node.
 * The platform provider window (`/platform/provider`) is always present
 * in a running platform.
 */
export async function findPlatformPage(browser: Browser): Promise<Page> {
  for (const page of listPages(browser)) {
    try {
      const hasFin = await page.evaluate(
        () => typeof (globalThis as { fin?: unknown }).fin !== 'undefined',
      );
      if (hasFin) return page;
    } catch {
      /* page may have closed */
    }
  }
  throw new Error(
    'No OpenFin-aware page found via CDP. Is the platform actually running ' +
      '(npm run dev:openfin:markets-react)?',
  );
}
