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
import { svgToDataUrl } from "./icons";
import type { PlatformSettings } from "./types";

// ─── Theme icon colors ──────────────────────────────────────────────
// These colors are used for SVG icons in the dock.
// White for dark backgrounds, dark navy for light backgrounds.
const ICON_COLOR_DARK_THEME = "#ffffff";
const ICON_COLOR_LIGHT_THEME = "#1a1a2e";

// ─── Module-level state ──────────────────────────────────────────────
// These variables persist for the lifetime of the provider window.
// They are set during registerDock() and updated as the user changes
// the dock configuration or toggles the theme.

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
 * Theme toggle icon URLs — swapped when the theme changes.
 * darkIcon: shown while in dark mode (e.g. a sun — click to go light).
 * lightIcon: shown while in light mode (e.g. a moon — click to go dark).
 */
let themeToggleDarkIcon: string | undefined;
let themeToggleLightIcon: string | undefined;

// ─── SVG Icons (all use "currentColor" for theme support) ────────────
// Each icon is a minimal 24x24 SVG. The "currentColor" value gets
// replaced with the actual theme color by svgToDataUrl().

/** Wrench icon — used for the Tools dropdown button. */
const TOOLS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

/** Gear icon — used for the Dock Editor menu item. */
const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

/** Refresh icon — used for "Reload Dock" menu item. */
const REFRESH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

/** Code/terminal icon — used for "Show Developer Tools" menu item. */
const CODE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

/** Download icon — used for "Export Config" menu item. */
const DOWNLOAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

/** Upload icon — used for "Import Config" menu item. */
const UPLOAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

/** Eye icon — used for "Show/Hide Provider" menu item. */
const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

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
      action: { id: "open-dock-editor" },
    },
    {
      tooltip: "Reload Dock",
      iconUrl: svgToDataUrl(REFRESH_SVG, ICON_COLOR_DARK_THEME),
      action: { id: "reload-dock" },
    },
    {
      tooltip: "Developer Tools",
      iconUrl: svgToDataUrl(CODE_SVG, ICON_COLOR_DARK_THEME),
      action: { id: "show-devtools" },
    },
    {
      tooltip: "Export Config",
      iconUrl: svgToDataUrl(DOWNLOAD_SVG, ICON_COLOR_DARK_THEME),
      action: { id: "export-config" },
    },
    {
      tooltip: "Import Config",
      iconUrl: svgToDataUrl(UPLOAD_SVG, ICON_COLOR_DARK_THEME),
      action: { id: "import-config" },
    },
    {
      tooltip: "Show/Hide Provider",
      iconUrl: svgToDataUrl(EYE_SVG, ICON_COLOR_DARK_THEME),
      action: { id: "toggle-provider-window" },
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
 * Also subscribes to the "dock-config-update" IAB topic so the dock
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
  themeToggleDarkIcon = darkIcon;
  themeToggleLightIcon = lightIcon;

  // --- 1. Build system buttons (always present at the end of the dock) ---
  systemButtons = [];

  // Add the theme toggle button if at least one icon was provided.
  // The icon shown depends on the current theme and is swapped in applyDockButtons().
  const initialToggleIcon = darkIcon ?? lightIcon;
  if (initialToggleIcon) {
    systemButtons.push({
      tooltip: "Toggle Theme",
      iconUrl: initialToggleIcon,
      action: { id: "toggle-theme" },
    });
  }

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
      action: { id: "launch-app", customData: app },
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
      workspaceComponents: ["home", "store", "notifications", "switchWorkspace"],
      disableUserRearrangement: true,
      buttons: allButtons,
    });

    console.log("Dock provider initialized.");

    // --- 4. Listen for live config updates from the dock editor window ---
    // The dock editor publishes on the "dock-config-update" IAB topic
    // whenever the user saves changes.
    try {
      await fin.InterApplicationBus.subscribe(
        { uuid: fin.me.identity.uuid },
        "dock-config-update",
        async (config: DockEditorConfig) => {
          console.log("Received dock config update via IAB.");
          await saveDockConfig(config);
          const updatedUserButtons = toOpenFinDockButtons(config);
          await applyDockButtons(updatedUserButtons);
        },
      );
    } catch (iabError) {
      console.warn("Could not subscribe to dock-config-update IAB topic.", iabError);
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
  copy.iconUrl = recolorIconifyUrl(copy.iconUrl ?? "", effectiveColor);

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
    // Tools dropdown — rebuild entirely with fresh SVG colors
    if ((button as any).id === "tools") {
      return buildToolsDropdown(currentIconColor);
    }

    // Theme toggle — swap icon based on current theme
    if ((button as any).action?.id === "toggle-theme") {
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
