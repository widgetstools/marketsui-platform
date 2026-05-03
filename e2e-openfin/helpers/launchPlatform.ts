import { connect, launch, type NodeFin } from '@openfin/node-adapter';
import { setDefaultResultOrder } from 'node:dns';

export interface PlatformHandle {
  fin: NodeFin;
  port: number;
  debugPort: number;
  manifestUrl: string;
  platformUuid: string;
  quit: () => Promise<void>;
}

export interface LaunchPlatformOptions {
  manifestUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_MANIFEST_URL = 'http://localhost:5174/platform/manifest.fin.json';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEBUG_PORT = 9090;

export async function launchPlatform(opts: LaunchPlatformOptions = {}): Promise<PlatformHandle> {
  const manifestUrl = opts.manifestUrl ?? DEFAULT_MANIFEST_URL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    setDefaultResultOrder('ipv4first');
  } catch {
    // older node versions
  }

  const port = await withTimeout(
    launch({ manifestUrl }),
    timeoutMs,
    `launch(${manifestUrl}) timed out after ${timeoutMs}ms`,
  );

  const fin = await withTimeout(
    connect({
      uuid: `e2e-openfin-${Date.now()}`,
      address: `ws://127.0.0.1:${port}`,
      nonPersistent: true,
    }),
    timeoutMs,
    `connect(ws://127.0.0.1:${port}) timed out after ${timeoutMs}ms`,
  );

  const manifest = await withTimeout(
    fin.System.fetchManifest(manifestUrl),
    timeoutMs,
    `fetchManifest(${manifestUrl}) timed out after ${timeoutMs}ms`,
  );

  const platformUuid = manifest?.platform?.uuid;
  if (!platformUuid) {
    throw new Error(
      `Manifest at ${manifestUrl} does not declare platform.uuid — node-adapter cannot wrap it as a Platform`,
    );
  }

  const platform = fin.Platform.wrapSync({ uuid: platformUuid });

  await withTimeout(
    new Promise<void>((resolve) => {
      platform.once('platform-api-ready', () => resolve());
    }),
    timeoutMs,
    `platform-api-ready not emitted within ${timeoutMs}ms for ${platformUuid}`,
  );

  let quitRequested = false;
  const quit = async () => {
    if (quitRequested) return;
    quitRequested = true;
    try {
      await platform.quit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no longer connected')) return;
      throw err;
    }
  };

  return { fin, port, debugPort: DEBUG_PORT, manifestUrl, platformUuid, quit };
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
