// ─── Workspace initialization ────────────────────────────────────────
export { initWorkspace } from "./workspace";
export { launchApp } from "./launch";

// ─── Dock management ─────────────────────────────────────────────────
export { updateDockButtons, getDefaultEditorConfig, recolorDockIcons } from "./dock";

// ─── Persistence (config service) ────────────────────────────────────
export { saveDockConfig, loadDockConfig, clearDockConfig } from "./db";

// Re-export config service types for convenience
export { createConfigManager, type ConfigManager } from "@marketsui/config-service";
export type {
  AppConfigRow,
  AppRegistryRow,
  UserProfileRow,
  RoleRow,
} from "@marketsui/config-service";

// ─── Dock config types + converter ───────────────────────────────────
export {
  toOpenFinDockButtons,
  appsToEditorConfig,
  type DockEditorConfig,
  type DockButtonConfig,
  type DockActionButtonConfig,
  type DockDropdownButtonConfig,
  type DockMenuItemConfig,
} from "./dock-config-types";

// ─── Icon library ────────────────────────────────────────────────────
export {
  TRADING_ICONS,
  getIconCategories,
  svgToDataUrl,
  type TradingIcon,
} from "./icons";

// ─── Types ───────────────────────────────────────────────────────────
export type {
  WorkspaceConfig,
  PlatformSettings,
  CustomSettings,
  UserRole,
} from "./types";
