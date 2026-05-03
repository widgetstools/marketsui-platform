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
  /** Timeout for the initial RVM port-discovery step. Default 180_000ms — RVM cold-start + manifest fetch can be slow. */
  launchTimeoutMs?: number;
  /** Timeout for connect / fetchManifest / platform-api-ready. Default 30_000ms. */
  stageTimeoutMs?: number;
}

// Manifest URL must match the host that the manifest's internal URLs
// (providerUrl, view manifest URLs) declare — otherwise OpenFin's security
// realm enforcement treats them as cross-origin and the runtime
// self-terminates ~70ms after spawn. The reference app manifest hard-codes
// `localhost:5174`, so the harness must use the same.
const DEFAULT_MANIFEST_URL = 'http://localhost:5174/platform/manifest.fin.json';
const DEFAULT_LAUNCH_TIMEOUT_MS = 180_000;
const DEFAULT_STAGE_TIMEOUT_MS = 30_000;
const DEBUG_PORT = 9090;

export async function launchPlatform(opts: LaunchPlatformOptions = {}): Promise<PlatformHandle> {
  const manifestUrl = opts.manifestUrl ?? DEFAULT_MANIFEST_URL;
  const launchTimeoutMs = opts.launchTimeoutMs ?? DEFAULT_LAUNCH_TIMEOUT_MS;
  const stageTimeoutMs = opts.stageTimeoutMs ?? DEFAULT_STAGE_TIMEOUT_MS;

  try {
    setDefaultResultOrder('ipv4first');
  } catch {
    // older node versions
  }

  const port = await withTimeout(
    launch({ manifestUrl }),
    launchTimeoutMs,
    `launch(${manifestUrl}) timed out after ${launchTimeoutMs}ms`,
  );

  const fin = await withTimeout(
    connect({
      uuid: `e2e-openfin-${Date.now()}`,
      address: `ws://127.0.0.1:${port}`,
      nonPersistent: true,
    }),
    stageTimeoutMs,
    `connect(ws://127.0.0.1:${port}) timed out after ${stageTimeoutMs}ms`,
  );

  const manifest = await withTimeout(
    fin.System.fetchManifest(manifestUrl),
    stageTimeoutMs,
    `fetchManifest(${manifestUrl}) timed out after ${stageTimeoutMs}ms`,
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
    stageTimeoutMs,
    `platform-api-ready not emitted within ${stageTimeoutMs}ms for ${platformUuid}`,
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
