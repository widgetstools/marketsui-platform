import {
  DockButtonNames,
  type DockButton,
} from "@openfin/workspace";

// ─── Serializable types (safe for IndexedDB / JSON) ─────────────────

export interface DockActionButtonConfig {
  type: "ActionButton";
  id: string;
  tooltip: string;
  iconUrl: string;
  /** Iconify icon ID (e.g. "lucide:file-text"). Stored so we can regenerate iconUrl for any theme. */
  iconId?: string;
  /**
   * User-chosen icon color (hex, e.g. "#0A76D3").
   * When set, the icon keeps this color regardless of dark/light theme.
   * When not set, the icon is recolored to match the current theme.
   */
  iconColor?: string;
  actionId: string;
  customData?: unknown;
}

export interface DockMenuItemConfig {
  id: string;
  tooltip: string;
  iconUrl?: string;
  /** Iconify icon ID (e.g. "lucide:file-text"). Stored so we can regenerate iconUrl for any theme. */
  iconId?: string;
  /**
   * User-chosen icon color (hex, e.g. "#0A76D3").
   * When set, the icon keeps this color regardless of dark/light theme.
   * When not set, the icon is recolored to match the current theme.
   */
  iconColor?: string;
  actionId?: string;
  customData?: unknown;
  /** Nested sub-menu items */
  options?: DockMenuItemConfig[];
}

export interface DockDropdownButtonConfig {
  type: "DropdownButton";
  id: string;
  tooltip: string;
  iconUrl: string;
  /** Iconify icon ID (e.g. "lucide:file-text"). Stored so we can regenerate iconUrl for any theme. */
  iconId?: string;
  /**
   * User-chosen icon color (hex, e.g. "#0A76D3").
   * When set, the icon keeps this color regardless of dark/light theme.
   * When not set, the icon is recolored to match the current theme.
   */
  iconColor?: string;
  options: DockMenuItemConfig[];
}

export type DockButtonConfig = DockActionButtonConfig | DockDropdownButtonConfig;

export interface DockEditorConfig {
  version: 1;
  buttons: DockButtonConfig[];
  updatedAt: string;
}

// ─── Converter: serializable config → OpenFin DockButton[] ──────────

function convertMenuItem(item: DockMenuItemConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {
    tooltip: item.tooltip,
  };
  if (item.iconUrl) result.iconUrl = item.iconUrl;
  if (item.iconColor) result.iconColor = item.iconColor;
  if (item.actionId) {
    result.action = {
      id: item.actionId,
      ...(item.customData != null ? { customData: item.customData } : {}),
    };
  }
  if (item.options?.length) {
    result.options = item.options.map(convertMenuItem);
  }
  return result;
}

export function toOpenFinDockButtons(config: DockEditorConfig): DockButton[] {
  return config.buttons.map((btn) => {
    if (btn.type === "DropdownButton") {
      return {
        type: DockButtonNames.DropdownButton,
        tooltip: btn.tooltip,
        id: btn.id,
        iconUrl: btn.iconUrl,
        iconColor: btn.iconColor,
        options: btn.options.map(convertMenuItem),
      } as unknown as DockButton;
    }
    // ActionButton
    return {
      tooltip: btn.tooltip,
      id: btn.id,
      iconUrl: btn.iconUrl,
      iconColor: btn.iconColor,
      action: {
        id: btn.actionId,
        ...(btn.customData != null ? { customData: btn.customData } : {}),
      },
    } as DockButton;
  });
}

/**
 * Convert the current manifest-based apps into a DockEditorConfig
 * so the editor can show them as the "default" state.
 */
export function appsToEditorConfig(
  apps: { appId: string; title: string; icons?: { src: string }[]; manifest?: string }[],
  fallbackIcon: string,
): DockEditorConfig {
  const options: DockMenuItemConfig[] = apps.map((app) => ({
    id: `app-${app.appId}`,
    tooltip: app.title,
    iconUrl: app.icons?.length ? app.icons[0].src : fallbackIcon,
    actionId: "launch-app",
    customData: app,
  }));

  return {
    version: 1,
    buttons: [
      {
        type: "DropdownButton",
        id: "apps",
        tooltip: "Apps",
        iconUrl: fallbackIcon,
        options,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
