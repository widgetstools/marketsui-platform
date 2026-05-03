import { test as base, type Browser, type Page } from '@playwright/test';
import { launchPlatform, type PlatformHandle } from '../helpers/launchPlatform';
import {
  connectViaCDP,
  findPageByUrlSubstring,
  findPlatformPage,
} from '../helpers/connectPlaywright';

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
const DEBUG_PORT = 9090;

/**
 * When true, the harness assumes an OpenFin runtime is already running
 * (e.g. via `npm run dev:openfin:markets-react`) and only attaches via
 * CDP. View creation/cleanup is driven through `page.evaluate` on a
 * platform window. Useful when the harness's own RVM lifecycle is
 * fighting with the user's environment.
 *
 * Set with `OPENFIN_ATTACH=1`.
 */
const ATTACH = process.env.OPENFIN_ATTACH === '1';

export const test = base.extend<OpenFinTestFixtures, OpenFinWorkerFixtures>({
  platform: [
    async ({}, use) => {
      if (ATTACH) {
        // Read platform UUID from any page that exposes `fin`. The platform
        // provider window (/platform/provider) always does. We don't keep a
        // node-adapter `fin` handle in attach mode — operations route via
        // `page.evaluate` instead.
        const browser = await connectViaCDP(DEBUG_PORT);
        let platformUuid = 'react-workspace-starter';
        try {
          const page = await findPlatformPage(browser);
          const uuid = await page.evaluate(
            () =>
              ((globalThis as { fin?: { me?: { identity?: { uuid?: string } } } })
                .fin?.me?.identity?.uuid) ?? null,
          );
          if (uuid) platformUuid = uuid;
        } finally {
          await browser.close().catch(() => undefined);
        }
        const stub: PlatformHandle = {
          // `fin` is unused in attach mode — accessing it is a programming
          // error against this harness's contract.
          fin: undefined as unknown as PlatformHandle['fin'],
          port: -1,
          debugPort: DEBUG_PORT,
          manifestUrl: 'http://localhost:5174/platform/manifest.fin.json',
          platformUuid,
          quit: async () => undefined, // user owns the runtime lifecycle
        };
        await use(stub);
        return;
      }

      const handle = await launchPlatform();
      try {
        await use(handle);
      } finally {
        await handle.quit();
      }
    },
    { scope: 'worker', timeout: 240_000 },
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
    { scope: 'worker', timeout: 60_000 },
  ],

  openView: async ({ platform, cdpBrowser }, use) => {
      const opened: string[] = [];

      const open: OpenView = async (manifestUrl: string) => {
        const viewName = `e2e-view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        if (ATTACH) {
          // Drive Platform.createWindow from any platform window, embedding
          // the view via the manifest URL. Plain Platform.createView returns
          // a *detached* view (no renderer, no CDP target) until it's
          // attached to a window's layout — using createWindow with a layout
          // is the path that actually loads the URL and spawns a renderer.
          const driverPage = await findPlatformPage(cdpBrowser);
          await driverPage.evaluate(
            async ({ name, manifestUrl }) => {
              const fin = (globalThis as unknown as { fin: any }).fin;
              await fin.Platform.getCurrentSync().createWindow({
                name: `${name}-window`,
                defaultWidth: 1024,
                defaultHeight: 720,
                layout: {
                  content: [
                    {
                      type: 'stack',
                      content: [
                        {
                          type: 'component',
                          componentName: 'view',
                          componentState: { name, manifestUrl },
                        },
                      ],
                    },
                  ],
                },
              });
            },
            { name: viewName, manifestUrl },
          );
        } else {
          const platformApi = platform.fin.Platform.getCurrentSync();
          // createView signature varies across @openfin/node-adapter generics; the
          // shape we need (name + manifestUrl) is supported but not in the public typings.
          await (platformApi.createView as unknown as (
            opts: { name: string; manifestUrl: string },
            target?: unknown,
          ) => Promise<unknown>)({ name: viewName, manifestUrl }, undefined);
        }
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
            if (ATTACH) {
              const driverPage = await findPlatformPage(cdpBrowser);
              await driverPage.evaluate(
                async ({ uuid, name }) => {
                  const fin = (globalThis as unknown as {
                    fin: {
                      View: {
                        wrapSync: (id: { uuid: string; name: string }) => {
                          destroy: () => Promise<void>;
                        };
                      };
                    };
                  }).fin;
                  await fin.View.wrapSync({ uuid, name }).destroy();
                },
                { uuid: platform.platformUuid, name },
              );
            } else {
              await platform.fin.View.wrapSync({
                uuid: platform.platformUuid,
                name,
              }).destroy();
            }
          } catch {
            /* already gone */
          }
        }
      }
    },
});

export { expect } from '@playwright/test';
