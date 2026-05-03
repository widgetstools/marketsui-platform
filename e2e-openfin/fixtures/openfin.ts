import { test as base, type Browser, type Page } from '@playwright/test';
import { launchPlatform, type PlatformHandle } from '../helpers/launchPlatform';
import { connectViaCDP, findPageByUrlSubstring } from '../helpers/connectPlaywright';

export type OpenView = (manifestUrl: string) => Promise<Page>;

export interface OpenFinTestFixtures {
  openView: OpenView;
}

export interface OpenFinWorkerFixtures {
  platform: PlatformHandle;
  cdpBrowser: Browser;
}

const VIEW_APPEAR_TIMEOUT_MS = 15_000;
const VIEW_POLL_INTERVAL_MS = 200;

export const test = base.extend<OpenFinTestFixtures, OpenFinWorkerFixtures>({
  platform: [
    async ({}, use) => {
      const handle = await launchPlatform();
      try {
        await use(handle);
      } finally {
        await handle.quit();
      }
    },
    { scope: 'worker' },
  ],

  cdpBrowser: [
    async ({ platform }, use) => {
      const browser = await connectViaCDP(platform.debugPort);
      try {
        await use(browser);
      } finally {
        try {
          await browser.close();
        } catch {
          /* runtime may already be torn down by the platform fixture */
        }
      }
    },
    { scope: 'worker' },
  ],

  openView: async ({ platform, cdpBrowser }, use) => {
      const opened: string[] = [];

      const open: OpenView = async (manifestUrl: string) => {
        const viewName = `e2e-view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const platformApi = platform.fin.Platform.getCurrentSync();
        // createView signature varies across @openfin/node-adapter generics; the
        // shape we need (name + manifestUrl) is supported but not in the public typings.
        await (platformApi.createView as unknown as (
          opts: { name: string; manifestUrl: string },
          target?: unknown,
        ) => Promise<unknown>)({ name: viewName, manifestUrl }, undefined);
        opened.push(viewName);

        // Match on the URL portion before `.fin.json` — the Page's URL is the
        // manifest's `url` field, not the manifest URL itself.
        const urlPart = manifestUrl.replace(/\.fin\.json$/, '');
        const start = Date.now();
        while (Date.now() - start < VIEW_APPEAR_TIMEOUT_MS) {
          const page = await findPageByUrlSubstring(cdpBrowser, urlPart);
          if (page) return page;
          await new Promise((r) => setTimeout(r, VIEW_POLL_INTERVAL_MS));
        }
        throw new Error(
          `View did not appear within ${VIEW_APPEAR_TIMEOUT_MS}ms: ${manifestUrl}`,
        );
      };

      try {
        await use(open);
      } finally {
        for (const name of opened) {
          try {
            await platform.fin.View.wrapSync({
              uuid: platform.platformUuid,
              name,
            }).destroy();
          } catch {
            /* already gone */
          }
        }
      }
    },
});

export { expect } from '@playwright/test';
