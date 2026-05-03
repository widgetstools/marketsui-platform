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
