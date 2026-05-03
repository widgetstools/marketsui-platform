/**
 * Attach mode diagnostic — connects via CDP, finds a platform-aware page,
 * tries to call Platform.createView, lists pages before/after.
 *
 *   npx tsx helpers/__diag__.ts
 */
import { connectViaCDP, listPages, findPlatformPage } from './connectPlaywright';

const VIEW_URL = 'http://localhost:5174/views/test-blotter-a.fin.json';

async function main() {
  const browser = await connectViaCDP(9090);
  console.log('connected via CDP. existing pages:');
  for (const p of listPages(browser)) console.log(`  - ${p.url()}`);

  const driverPage = await findPlatformPage(browser);
  console.log(`\ndriver page: ${driverPage.url()}`);

  const viewName = `e2e-diag-${Date.now()}`;

  // Fetch the manifest from Node side — driverPage is workspace.openfin.co
  // (cross-origin to localhost:5174 → CORS rejection).
  const manifestRes = await fetch(VIEW_URL);
  const manifest = await manifestRes.json() as { url: string };
  console.log('\nview manifest url:', manifest.url);

  const result = await driverPage.evaluate(
    async ({ name, viewUrl }) => {
      try {
        const fin = (globalThis as unknown as { fin: any }).fin;
        const platform = fin.Platform.getCurrentSync();
        const win = await platform.createWindow({
          name: `${name}-window`,
          defaultWidth: 1024,
          defaultHeight: 720,
          autoShow: true,
          layout: {
            content: [
              {
                type: 'stack',
                content: [
                  {
                    type: 'component',
                    componentName: 'view',
                    componentState: { name, url: viewUrl },
                  },
                ],
              },
            ],
          },
        });
        return { ok: true, identity: win?.identity ?? null };
      } catch (err) {
        const e = err as Error;
        return { ok: false, message: e.message, stack: e.stack };
      }
    },
    { name: viewName, viewUrl: manifest.url },
  );

  console.log('\ncreateView result:', JSON.stringify(result, null, 2));

  const startCount = listPages(browser).length;
  console.log(`\nstart page count: ${startCount}`);

  // poll for up to 15s for ANY new page (count increases)
  let foundNewPage = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const pages = listPages(browser);
    if (pages.length > startCount) {
      console.log(`\nNEW page detected after ${i + 1}s — count ${startCount} → ${pages.length}`);
      foundNewPage = true;
      break;
    }
    // also poll raw CDP just to see
    const rawRes = await fetch('http://127.0.0.1:9090/json/list');
    const raw = await rawRes.json() as Array<{ url: string }>;
    if (i === 0 || i === 4 || i === 9) {
      console.log(`  [${i + 1}s] playwright sees ${pages.length}, raw CDP ${raw.length}`);
    }
  }
  if (!foundNewPage) console.log('\nno new page in 15s');

  console.log('\npages at end:');
  for (const p of listPages(browser)) console.log(`  - ${p.url()}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
