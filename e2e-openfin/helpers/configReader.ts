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

interface DebugConfigRowFull extends ConfigRowSnapshot {
  payload?: { gridLevelData?: { liveProviderId?: string | null } & Record<string, unknown> } & Record<string, unknown>;
}

interface DebugConfigManager {
  queryConfigs: (filter: {
    appIds?: string[];
    userIds?: string[];
    componentTypes?: string[];
  }) => Promise<DebugConfigRowFull[]>;
  getConfig: (configId: string) => Promise<DebugConfigRowFull | undefined>;
  updateConfig: (configId: string, patch: Record<string, unknown>) => Promise<DebugConfigRowFull>;
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

/**
 * Read `payload.gridLevelData.liveProviderId` from the row keyed by
 * `configId` (which is the OpenFin `customData.instanceId`). Returns
 * `null` when the row exists but has no gridLevelData yet, and
 * `undefined` when no row exists.
 *
 * Used by the multi-window isolation spec to assert that a write under
 * one view's instanceId never spills into the sibling view's row.
 */
export async function readGridLevelLiveProviderId(
  page: Page,
  configId: string,
): Promise<string | null | undefined> {
  return page.evaluate(async (id) => {
    const cm = (window as unknown as { __configManager?: unknown })
      .__configManager as DebugConfigManager | undefined;
    if (!cm || typeof cm.getConfig !== 'function') {
      throw new Error(
        'window.__configManager is unavailable — ensure the reference app ' +
          'is running under `vite dev` (import.meta.env.DEV) so the debug hook is wired.',
      );
    }
    const row = await cm.getConfig(id);
    if (!row) return undefined;
    const gld = row.payload?.gridLevelData;
    if (!gld || typeof gld !== 'object') return null;
    return gld.liveProviderId ?? null;
  }, configId);
}

/**
 * Stamp `gridLevelData.liveProviderId` onto an existing row. Mirrors
 * the read-modify-write that `createConfigServiceStorage`'s
 * `saveGridLevelData` performs internally — preserves the rest of the
 * payload (profiles, version) and never replaces it wholesale. Throws
 * if the row doesn't exist; the caller is expected to seed the row
 * (via a profile create through the real UI) before stamping.
 */
export async function setGridLevelLiveProviderId(
  page: Page,
  configId: string,
  liveProviderId: string,
): Promise<void> {
  await page.evaluate(
    async ({ id, providerId }) => {
      const cm = (window as unknown as { __configManager?: unknown })
        .__configManager as DebugConfigManager | undefined;
      if (!cm || typeof cm.getConfig !== 'function' || typeof cm.updateConfig !== 'function') {
        throw new Error('window.__configManager is unavailable.');
      }
      const row = await cm.getConfig(id);
      if (!row) {
        throw new Error(`No row found for configId=${id}; seed it before stamping gridLevelData.`);
      }
      const existingPayload = (row.payload ?? {}) as Record<string, unknown>;
      const existingGld = (existingPayload.gridLevelData ?? {}) as Record<string, unknown>;
      const nextPayload = {
        ...existingPayload,
        gridLevelData: { ...existingGld, liveProviderId: providerId },
      };
      await cm.updateConfig(id, { payload: nextPayload });
    },
    { id: configId, providerId: liveProviderId },
  );
}

