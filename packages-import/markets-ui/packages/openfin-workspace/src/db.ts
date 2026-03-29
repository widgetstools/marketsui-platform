// ─── Dock config persistence (backed by @marketsui/config-service) ───
//
// This file provides the same public API as the original db.ts, but
// delegates all persistence to the shared ConfigManager from
// @marketsui/config-service.
//
// The dock-editor package imports these functions — by keeping the
// same export signatures, no changes are needed in dock-editor.
//
// The ConfigManager singleton is initialized in workspace.ts during
// platform startup. Until then, these functions create a temporary
// local ConfigManager as a fallback (this handles the dock-editor
// window, which runs in a separate process and may not have access
// to the provider's ConfigManager instance).

import { createConfigManager, type ConfigManager } from "@marketsui/config-service";
import type { DockEditorConfig } from "./dock-config-types";

// ─── Singleton management ────────────────────────────────────────────

/**
 * Module-level ConfigManager singleton.
 *
 * Set by `setConfigManager()` (called from workspace.ts during init).
 * If not set, a fallback instance is created on first use so that
 * the dock-editor window (which runs in a separate process) still
 * has access to the same Dexie database.
 */
let configManagerInstance: ConfigManager | undefined;

/**
 * Set the shared ConfigManager instance.
 * Called once from workspace.ts after creating and initializing
 * the ConfigManager during platform startup.
 */
export function setConfigManager(manager: ConfigManager): void {
  configManagerInstance = manager;
}

/**
 * Get the ConfigManager instance, creating a fallback if needed.
 *
 * The fallback handles the case where the dock-editor runs in a
 * separate OpenFin window — it creates its own ConfigManager that
 * connects to the same Dexie database.
 */
async function getConfigManager(): Promise<ConfigManager> {
  if (!configManagerInstance) {
    configManagerInstance = createConfigManager();
    await configManagerInstance.init();
  }
  return configManagerInstance;
}

// ─── Public API (same signatures as before) ──────────────────────────

/**
 * Save the dock button configuration.
 * Overwrites any previously saved config.
 */
export async function saveDockConfig(config: DockEditorConfig): Promise<void> {
  const manager = await getConfigManager();
  await manager.saveDockConfig(config);
}

/**
 * Load the saved dock button configuration.
 * Returns null if no config has been saved yet.
 */
export async function loadDockConfig(): Promise<DockEditorConfig | null> {
  const manager = await getConfigManager();
  return manager.loadDockConfig();
}

/**
 * Clear the saved dock configuration.
 * Next startup will fall back to manifest defaults.
 */
export async function clearDockConfig(): Promise<void> {
  const manager = await getConfigManager();
  await manager.clearDockConfig();
}
