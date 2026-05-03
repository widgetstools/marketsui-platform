import type { Page } from '@playwright/test';

/**
 * Subset of `AppConfigRow` the harness inspects. Mirrors the row fields
 * the registered-identity wrap stamps onto every persisted row in the
 * OpenFin path (`useHostedIdentity` → `createConfigServiceStorage`).
 */
export interface ConfigRowSnapshot {
  configId: string;
  appId: string;
  userId: string;
  componentType: string;
  componentSubType: string;
  isTemplate?: boolean;
  singleton?: boolean;
}

interface DebugConfigManager {
  queryConfigs: (filter: {
    appIds?: string[];
    userIds?: string[];
    componentTypes?: string[];
  }) => Promise<ConfigRowSnapshot[]>;
  deleteConfig: (configId: string) => Promise<boolean>;
}

/**
 * List rows for the given (appId, userId) scope via the dev-only
 * `window.__configManager` hook exposed by `apps/markets-ui-react-reference`'s
 * `main.tsx`. Throws if the hook isn't present — surfaces a clear failure
 * when the reference app is built in production mode.
 */
export async function listConfigsByOwner(
  page: Page,
  filter: { appId: string; userId: string },
): Promise<ConfigRowSnapshot[]> {
  return page.evaluate(async (f) => {
    const cm = (window as unknown as { __configManager?: unknown })
      .__configManager as DebugConfigManager | undefined;
    if (!cm || typeof cm.queryConfigs !== 'function') {
      throw new Error(
        'window.__configManager is unavailable — ensure the reference app ' +
          'is running under `vite dev` (import.meta.env.DEV) so the debug hook is wired.',
      );
    }
    const rows = await cm.queryConfigs({ appIds: [f.appId], userIds: [f.userId] });
    return rows.map((r) => ({
      configId: r.configId,
      appId: r.appId,
      userId: r.userId,
      componentType: r.componentType,
      componentSubType: r.componentSubType,
      isTemplate: r.isTemplate,
      singleton: r.singleton,
    }));
  }, filter);
}

/**
 * Delete every row matching the (appId, userId) scope. Returns the
 * number of rows deleted. Best-effort — swallows per-row failures so a
 * single corrupt row can't strand the harness.
 */
export async function deleteConfigsByOwner(
  page: Page,
  filter: { appId: string; userId: string },
): Promise<number> {
  return page.evaluate(async (f) => {
    const cm = (window as unknown as { __configManager?: unknown })
      .__configManager as DebugConfigManager | undefined;
    if (!cm || typeof cm.queryConfigs !== 'function') return 0;
    const rows = await cm.queryConfigs({ appIds: [f.appId], userIds: [f.userId] });
    let deleted = 0;
    for (const r of rows) {
      try {
        await cm.deleteConfig(r.configId);
        deleted += 1;
      } catch {
        /* skip — another writer raced us, or the row already left */
      }
    }
    return deleted;
  }, filter);
}

