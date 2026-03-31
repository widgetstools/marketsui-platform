// ─── Workspace initialization ────────────────────────────────────────
export { initWorkspace } from "./workspace";
export { launchApp } from "./launch";

// ─── Dock management ─────────────────────────────────────────────────
export {
  updateDockButtons,
  getDefaultEditorConfig,
  recolorDockIcons,
  // IAB topic names — exported so packages that publish/subscribe
  // to these topics use the same string constant, not separate literals.
  IAB_DOCK_CONFIG_UPDATE,
  IAB_RELOAD_AFTER_IMPORT,
  IAB_THEME_CHANGED,
} from "./dock";

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
  MARKET_ICON_SVGS,
  svgToDataUrl,
  marketIconToDataUrl,
} from "./icons";

export {
  ICON_META,
  ICON_NAMES,
  ICON_CATEGORIES,
  ICON_CATEGORY_NAMES,
  getIconsByCategory,
  type MarketIconName,
  type IconCategory,
  type IconMeta,
} from "./icons";

// ─── Types ───────────────────────────────────────────────────────────
export type {
  WorkspaceConfig,
  PlatformSettings,
  CustomSettings,
  UserRole,
} from "./types";
