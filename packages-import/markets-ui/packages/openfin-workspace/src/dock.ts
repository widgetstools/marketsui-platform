/* eslint-disable @typescript-eslint/no-explicit-any */
declare const fin: any;
import {
  Dock,
  DockButtonNames,
  type App,
  type DockButton,
  type DockProviderRegistration,
  type RegistrationMetaInfo,
} from "@openfin/workspace";
import { loadDockConfig, saveDockConfig } from "./db";
import {
  appsToEditorConfig,
  toOpenFinDockButtons,
  type DockEditorConfig,
} from "./dock-config-types";
import {
  TOOLS_SVG,
  SETTINGS_SVG,
  REFRESH_SVG,
  CODE_SVG,
  DOWNLOAD_SVG,
  UPLOAD_SVG,
  SUN_SVG,
  MOON_SVG,
  EYE_SVG,
  svgToDataUrl,
  marketIconToDataUrl,
} from "@markets/icons-svg/all-icons";
import type { PlatformSettings } from "./types";

// ─── Theme icon colors ──────────────────────────────────────────────
// These hex colors are applied to SVG icons so they are visible on
// the dock bar regardless of the current theme:
//   - Dark theme → white icons on a dark bar
//   - Light theme → dark navy icons on a light bar
const ICON_COLOR_DARK_THEME = "#ffffff";
const ICON_COLOR_LIGHT_THEME = "#1a1a2e";

// ─── IAB topic names ────────────────────────────────────────────────
// The InterApplicationBus (IAB) is OpenFin's messaging system between
// windows. We use named constants here so that if a topic name ever
// needs to change, you only update it in one place.
/** Published by the dock editor when the user saves button changes. */
export const IAB_DOCK_CONFIG_UPDATE = "dock-config-update";
/** Published by the import-config window after a successful import. */
export const IAB_RELOAD_AFTER_IMPORT = "reload-dock-after-import";
/** Published by workspace.ts when the user toggles the theme. */
export const IAB_THEME_CHANGED = "theme-changed";
/** Published by the registry editor when the user saves component entries. */
export const IAB_REGISTRY_CONFIG_UPDATE = "registry-config-update";

// ─── Action ID constants ─────────────────────────────────────────────
// These strings are the "action IDs" that link a dock button to its
// handler in workspace.ts. They must match exactly in both places.
// Exported so workspace.ts can use the same values without repeating
// the string literals.
export const ACTION_LAUNCH_APP        = "launch-app";
export const ACTION_TOGGLE_THEME      = "toggle-theme";
export const ACTION_OPEN_DOCK_EDITOR  = "open-dock-editor";
export const ACTION_RELOAD_DOCK       = "reload-dock";
export const ACTION_SHOW_DEVTOOLS     = "show-devtools";
export const ACTION_EXPORT_CONFIG     = "export-config";
export const ACTION_IMPORT_CONFIG     = "import-config";
export const ACTION_TOGGLE_PROVIDER   = "toggle-provider-window";
export const ACTION_OPEN_REGISTRY_EDITOR = "open-registry-editor";

// ─── Module-level state ──────────────────────────────────────────────
// These variables are initialised in registerDock() and then stay in
// memory for the lifetime of the provider window. Think of them as the
// "current state of the dock" — they are read and updated by other
// functions in this file (recolorDockIcons, applyDockButtons, etc.).
//
// ⚠️ Never import or mutate these from outside this file.
// Use the exported functions (registerDock, recolorDockIcons, etc.).

/** The OpenFin dock registration handle, needed to push button updates. */
let registration: DockProviderRegistration | undefined;

/** Cached copy of platform settings (id, title, icon) from the manifest. */
let storedPlatformSettings: PlatformSettings | undefined;

/** The dock provider icon URL (shown at the left of the dock bar). */
let storedIcon: string | undefined;

/** Built-in buttons added by the platform (theme toggle, tools dropdown). */
let systemButtons: DockButton[] = [];

/** User-configured buttons (from the dock editor or default app list). */
let lastUserButtons: DockButton[] = [];

/** Current icon color, updated when the theme is toggled. */
let currentIconColor = ICON_COLOR_DARK_THEME;

/**
 * Tracks whether IAB subscriptions have been set up.
 * Subscriptions must only be created once — re-subscribing on dock
 * reload would create duplicate listeners and can cause OpenFin errors.
 */
let iabSubscribed = false;

/**
 * Theme toggle icon URLs — swapped when the theme changes.
 * darkIcon: shown while in dark mode (e.g. a sun — click to go light).
 * lightIcon: shown while in light mode (e.g. a moon — click to go dark).
 */
let themeToggleDarkIcon: string | undefined;
let themeToggleLightIcon: string | undefined;

// ─── SVG Icons ──────────────────────────────────────────────────────
// All SVG icon strings are imported from @markets/icons-svg/all-icons.
// The .svg source files live in packages/icons-svg/svg/.

// Pre-built theme toggle data URLs with fixed colors that work on both dock backgrounds.
// Amber sun (#FFB300) is vivid on dark; black moon (#000000) is clear on light.
const DEFAULT_DARK_THEME_ICON = svgToDataUrl(SUN_SVG, "#FFB300");
const DEFAULT_LIGHT_THEME_ICON = svgToDataUrl(MOON_SVG, "#000000");

// ─── Tools dropdown helpers ───────────────────────────────────────────
// Menu item icons always use ICON_COLOR_DARK_THEME (#ffffff) because
// the dock dropdown is always rendered on a dark background regardless
// of the current platform theme. Only the wrench button itself changes.

/**
 * Build the menu items for the Tools dropdown.
 * Icons are always white — the dropdown background is always dark.
 */
function buildToolsMenuItems(): any[] {
  return [
    {
      tooltip: "Dock Editor",
      iconUrl: svgToDataUrl(SETTINGS_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_OPEN_DOCK_EDITOR },
    },
    {
      tooltip: "Component Registry",
      iconUrl: svgToDataUrl(SETTINGS_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_OPEN_REGISTRY_EDITOR },
    },
    {
      tooltip: "Reload Dock",
      iconUrl: svgToDataUrl(REFRESH_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_RELOAD_DOCK },
    },
    {
      tooltip: "Developer Tools",
      iconUrl: svgToDataUrl(CODE_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_SHOW_DEVTOOLS },
    },
    {
      tooltip: "Export Config",
      iconUrl: svgToDataUrl(DOWNLOAD_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_EXPORT_CONFIG },
    },
    {
      tooltip: "Import Config",
      iconUrl: svgToDataUrl(UPLOAD_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_IMPORT_CONFIG },
    },
    {
      tooltip: "Show/Hide Provider",
      iconUrl: svgToDataUrl(EYE_SVG, ICON_COLOR_DARK_THEME),
      action: { id: ACTION_TOGGLE_PROVIDER },
    },
  ];
}

/**
 * Build the Tools dropdown button.
 * The wrench icon uses `buttonColor` (follows the theme),
 * but menu item icons are always built with the dark color.
 */
function buildToolsDropdown(buttonColor: string): DockButton {
  return {
    type: DockButtonNames.DropdownButton,
    tooltip: "Tools",
    id: "tools",
    iconUrl: svgToDataUrl(TOOLS_SVG, buttonColor),
    options: buildToolsMenuItems(),
  } as DockButton;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Register the OpenFin dock with system buttons and user-configured buttons.
 *
 * System buttons (theme toggle, tools dropdown) are added automatically.
 * User buttons come from IndexedDB (saved dock editor config) or fall
 * back to the app list from the manifest.
 *
 * Also subscribes to the IAB_DOCK_CONFIG_UPDATE topic so the dock
 * editor can push live updates without a restart.
 */
export async function registerDock(
  platformSettings: PlatformSettings,
  apps?: App[],
  dockIcon?: string,
  darkIcon?: string,
  lightIcon?: string,
  roles?: string[],
): Promise<RegistrationMetaInfo | undefined> {
  console.log("Initializing the dock provider.");

  // Cache settings for later use in applyDockButtons()
  storedPlatformSettings = platformSettings;
  storedIcon = dockIcon ?? platformSettings.icon;
  // Use provided icons or fall back to the built-in SVG defaults.
  themeToggleDarkIcon = darkIcon ?? DEFAULT_DARK_THEME_ICON;
  themeToggleLightIcon = lightIcon ?? DEFAULT_LIGHT_THEME_ICON;

  // --- 1. Build system buttons (always present at the end of the dock) ---
  systemButtons = [];

  // Theme toggle is always present — uses built-in sun/moon SVGs by default.
  systemButtons.push({
    tooltip: "Toggle Theme",
    iconUrl: themeToggleDarkIcon,
    action: { id: ACTION_TOGGLE_THEME },
  });

  // Tools dropdown with Dock Editor, Reload, DevTools, Export/Import, Provider toggle
  systemButtons.push(buildToolsDropdown(currentIconColor));

  // --- 2. Load user buttons from IndexedDB or fall back to app list ---
  let userButtons: DockButton[];

  const savedConfig = await loadDockConfig();
  if (savedConfig) {
    console.log("Loaded dock config from IndexedDB.");
    userButtons = toOpenFinDockButtons(savedConfig);
  } else {
    // No saved config — build a default "Apps" dropdown from the manifest
    const appMenuItems = (apps ?? []).map((app) => ({
      tooltip: app.title,
      iconUrl: app.icons?.length ? app.icons[0].src : platformSettings.icon,
      action: { id: ACTION_LAUNCH_APP, customData: app },
    }));

    userButtons = [
      {
        type: DockButtonNames.DropdownButton,
        tooltip: "Apps",
        id: "apps",
        iconUrl: platformSettings.icon,
        options: appMenuItems,
      } as DockButton,
    ];
  }

  // --- 3. Register the dock with OpenFin ---
  lastUserButtons = userButtons;
  const allButtons = [...userButtons, ...systemButtons];

  try {
    registration = await Dock.register({
      id: platformSettings.id,
      title: platformSettings.title,
      icon: storedIcon,
      workspaceComponents: ["notifications", "switchWorkspace"],
      // home and store are disabled via WorkspaceConfig.components
      disableUserRearrangement: true,
      buttons: allButtons,
    });

    console.log("Dock provider initialized.");

    // --- 4 & 5. IAB subscriptions — set up once only ---
    // On dock reload (deregister + register), registerDock() is called again.
    // Re-subscribing to the same IAB topics creates duplicate listeners and
    // can cause OpenFin errors that break the reload. Guard with iabSubscribed.
    if (!iabSubscribed) {
      iabSubscribed = true;

      // Listen for live config updates from the dock editor window.
      try {
        await fin.InterApplicationBus.subscribe(
          { uuid: fin.me.identity.uuid },
          IAB_DOCK_CONFIG_UPDATE,
          async (config: DockEditorConfig) => {
            console.log("Received dock config update via IAB.");
            await saveDockConfig(config);
            const updatedUserButtons = toOpenFinDockButtons(config);
            await applyDockButtons(updatedUserButtons);
          },
        );
      } catch (iabError) {
        console.error("Could not subscribe to dock-config-update IAB topic.", iabError);
      }

      // Listen for reload requests from the import config window.
      try {
        await fin.InterApplicationBus.subscribe(
          { uuid: fin.me.identity.uuid },
          IAB_RELOAD_AFTER_IMPORT,
          async () => {
            console.log("Reloading dock after config import.");
            const savedConfig = await loadDockConfig();
            if (savedConfig) {
              const updatedUserButtons = toOpenFinDockButtons(savedConfig);
              await applyDockButtons(updatedUserButtons);
            }
          },
        );
      } catch (iabError) {
        console.error("Could not subscribe to reload-dock-after-import IAB topic.", iabError);
      }
    }

    return registration;
  } catch (error) {
    console.error("Failed to register the dock provider.", error);
    return undefined;
  }
}

/**
 * Recolor all dock icons to match the current theme.
 *
 * Called directly from the toggle-theme action in workspace.ts.
 * Updates the module-level `currentIconColor` and re-renders every
 * button with the correct color.
 *
 * @param isDark - true when switching to dark theme, false for light
 */
export async function recolorDockIcons(isDark: boolean): Promise<void> {
  currentIconColor = isDark ? ICON_COLOR_DARK_THEME : ICON_COLOR_LIGHT_THEME;
  const themeName = isDark ? "dark" : "light";
  console.log(`Recoloring dock icons for ${themeName} theme (${currentIconColor})`);
  await applyDockButtons(lastUserButtons);
}

/**
 * Reload dock buttons from the saved config in IndexedDB.
 *
 * This is the correct way to "refresh" the dock at runtime — it reads
 * the latest saved config and pushes it to the dock via updateDockProviderConfig.
 *
 * Note: full deregister/re-register is NOT supported at runtime — the
 * OpenFin workspace channel closes on deregister and cannot reconnect.
 */
export async function reloadDockFromConfig(): Promise<void> {
  const savedConfig = await loadDockConfig();
  if (savedConfig) {
    const userButtons = toOpenFinDockButtons(savedConfig);
    await applyDockButtons(userButtons);
  } else {
    // No saved config — just re-apply the current buttons to refresh icons
    await applyDockButtons(lastUserButtons);
  }
  console.log("Dock reloaded from config.");
}

/**
 * Replace the dock buttons with the given editor config.
 * Saves to IndexedDB so the config persists across restarts.
 */
export async function updateDockButtons(config: DockEditorConfig): Promise<void> {
  await saveDockConfig(config);
  const userButtons = toOpenFinDockButtons(config);
  await applyDockButtons(userButtons);
}

/**
 * Build a default DockEditorConfig from the manifest app list.
 * Used by the dock editor when there is no saved config.
 */
export function getDefaultEditorConfig(apps: App[], fallbackIcon: string): DockEditorConfig {
  return appsToEditorConfig(apps, fallbackIcon);
}

// ─── Internal helpers ────────────────────────────────────────────────

/**
 * Update the `color` query parameter on an Iconify CDN URL.
 *
 * Iconify URLs look like: https://api.iconify.design/lucide/settings.svg?color=%23ffffff
 * This function swaps the color to match the current theme.
 *
 * Non-Iconify URLs (data URLs, .ico files, etc.) are returned unchanged.
 */
function recolorIconifyUrl(iconUrl: string, color: string): string {
  // Skip empty URLs or non-Iconify URLs
  if (!iconUrl || !iconUrl.includes("api.iconify.design/")) {
    return iconUrl;
  }

  try {
    const url = new URL(iconUrl);
    url.searchParams.set("color", color);
    return url.toString();
  } catch {
    // If the URL is malformed, return it unchanged rather than crashing
    return iconUrl;
  }
}

/**
 * Create a shallow copy of a top-level dock button with its icon URL
 * recolored to match the current theme.
 *
 * Only the button's own icon is recolored — dropdown menu item icons
 * are left unchanged because the dock dropdown is always rendered on
 * a dark background regardless of the platform theme.
 *
 * If the button has a user-chosen `iconColor`, that color is used
 * instead of the theme color so the icon stays fixed across theme changes.
 *
 * Does NOT modify the original button — returns a new object.
 */
function recolorButtonIcons(button: DockButton, themeColor: string): DockButton {
  const copy = { ...button } as any;

  // Use the user's custom color if set, otherwise use the theme color
  const effectiveColor = copy.iconColor ?? themeColor;

  // If the button stores an iconId, regenerate the URL from source.
  // This handles both "mkt:bond" (custom market icons) and "lucide:home" (Iconify CDN).
  if (copy.iconId) {
    const [prefix, name] = copy.iconId.split(":");
    if (prefix === "mkt" && name) {
      // Custom market icon — rebuild data URL from SVG string
      copy.iconUrl = marketIconToDataUrl(name, effectiveColor);
    } else {
      // Iconify CDN icon — recolor the URL parameter
      copy.iconUrl = recolorIconifyUrl(copy.iconUrl ?? "", effectiveColor);
    }
  } else {
    copy.iconUrl = recolorIconifyUrl(copy.iconUrl ?? "", effectiveColor);
  }

  // Menu item icons are NOT recolored — the dropdown is always dark,
  // so their iconUrls (baked in when the user configured them) remain correct.

  return copy as DockButton;
}

/**
 * Push an updated set of buttons to the OpenFin dock.
 *
 * This is the single place where dock buttons are sent to OpenFin.
 * Recolors only the top-level button icons to match the current theme.
 * Dropdown menu item icons are not recolored — the dock dropdown is
 * always dark so those icons are correct as stored.
 */
async function applyDockButtons(userButtons: DockButton[]): Promise<void> {
  // Guard: can't update if the dock hasn't been registered yet
  if (!registration || !storedPlatformSettings || !storedIcon) {
    console.error("Cannot update dock: not registered yet.");
    return;
  }

  // Remember the latest user buttons so recolorDockIcons() can re-use them
  lastUserButtons = userButtons;

  // Recolor user-configured buttons (Iconify URL color param updates)
  const coloredUserButtons = userButtons.map(
    (button) => recolorButtonIcons(button, currentIconColor),
  );

  // Rebuild system buttons with fresh SVG colors.
  // The Tools dropdown uses inline SVGs that need to be regenerated
  // with the current theme color on every update.
  const isDarkTheme = currentIconColor === ICON_COLOR_DARK_THEME;

  const coloredSystemButtons = systemButtons.map((button) => {
    // NOTE: OpenFin's DockButton type does not expose `id` or `action`
    // directly in its TypeScript definitions, so we cast to `any` to
    // read these fields. This is safe because we set them ourselves
    // when building the system buttons above.

    // Tools dropdown — rebuild entirely with fresh SVG colors
    if ((button as any).id === "tools") {
      return buildToolsDropdown(currentIconColor);
    }

    // Theme toggle — swap icon based on current theme
    if ((button as any).action?.id === ACTION_TOGGLE_THEME) {
      // In dark mode show the sun (darkIcon), in light mode show the moon (lightIcon)
      const toggleIcon = isDarkTheme ? themeToggleDarkIcon : themeToggleLightIcon;
      if (toggleIcon) {
        return { ...button, iconUrl: toggleIcon } as DockButton;
      }
    }

    // All other system buttons
    return recolorButtonIcons(button, currentIconColor);
  });

  const allButtons = [...coloredUserButtons, ...coloredSystemButtons];

  try {
    await registration.updateDockProviderConfig({
      title: storedPlatformSettings.title,
      icon: storedIcon,
      buttons: allButtons,
    });
    console.log("Dock buttons updated.");
  } catch (error) {
    console.error("Failed to update dock buttons.", error);
  }
}
