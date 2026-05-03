import { launchPlatform } from './launchPlatform.js';

async function main() {
  const start = Date.now();
  console.log('[smoke] launching platform...');
  const handle = await launchPlatform();
  const elapsed = Date.now() - start;
  console.log('[smoke] connected', {
    runtimePort: handle.port,
    debugPort: handle.debugPort,
    platformUuid: handle.platformUuid,
    manifestUrl: handle.manifestUrl,
    elapsedMs: elapsed,
  });
  console.log('[smoke] platform-api-ready confirmed; sleeping 2s before quit...');
  await new Promise((r) => setTimeout(r, 2000));
  console.log('[smoke] quitting platform...');
  await handle.quit();
  console.log('[smoke] done.');
}

main().catch((err) => {
  console.error('[smoke] failed:', err);
  process.exit(1);
});
