/* eslint-disable @typescript-eslint/no-explicit-any */
declare const fin: any;
import type OpenFin from "@openfin/core";
import { Dock, Home, Storefront, type App } from "@openfin/workspace";
import { ColorSchemeOptionType, CustomActionCallerType, getCurrentSync, init } from "@openfin/workspace-platform";
import { createConfigManager, type ConfigManager } from "@marketsui/config-service";
import { setConfigManager } from "./db";
import {
  registerDock,
  recolorDockIcons,
  reloadDockFromConfig,
  ACTION_LAUNCH_APP,
  ACTION_TOGGLE_THEME,
  ACTION_OPEN_DOCK_EDITOR,
  ACTION_RELOAD_DOCK,
  ACTION_SHOW_DEVTOOLS,
  ACTION_EXPORT_CONFIG,
  ACTION_IMPORT_CONFIG,
  ACTION_TOGGLE_PROVIDER,
  ACTION_OPEN_REGISTRY_EDITOR,
  IAB_THEME_CHANGED,
} from "./dock";
import { registerHome } from "./home";
import { launchApp } from "./launch";
import { registerNotifications } from "./notifications";
import { registerStore } from "./store";
import type { CustomSettings, PlatformSettings, WorkspaceConfig } from "./types";

/**
 * Prevents initWorkspace() from running more than once.
 * The platform can only be initialised a single time per provider window,
 * so a second call silently returns without doing anything.
 */
let isInitialized = false;

/** The shared ConfigManager instance, created during platform init. */
let configManager: ConfigManager | undefined;


/**
 * Initialize the OpenFin workspace platform and all workspace components
 * (Home, Store, Dock, Notifications).
 *
 * This is the main entry point — call it once from your provider window.
 * It reads platform settings from the manifest, sets up the theme and
 * custom actions, then registers each workspace component.
 */
export async function initWorkspace(config?: WorkspaceConfig): Promise<void> {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  // Default logger is a no-op if the caller didn't provide one
  const log = config?.onProgress ?? (() => {});

  // All components are enabled by default; the caller can disable them
  const components = {
    home: true,
    store: true,
    dock: true,
    notifications: true,
    ...config?.components,
  };

  log("Workspace platform initializing");

  const settings = await getManifestCustomSettings();

  // Initialize the config service before anything else.
  // It seeds the database on first run and starts the sync drain
  // loop if a REST URL is configured in the manifest.
  configManager = createConfigManager({
    seedConfigUrl: settings.customSettings?.seedConfigUrl,
    configServiceRestUrl: settings.customSettings?.configServiceRestUrl,
  });
  await configManager.init();

  // Share the ConfigManager with db.ts so dock config persistence
  // uses the same database as everything else.
  setConfigManager(configManager);

  log("Config service initialized");

  // Wait for the platform API to be ready before registering components.
  // The "platform-api-ready" event fires after init() completes below.
  const platform = fin.Platform.getCurrentSync();
  await platform.once("platform-api-ready", async () => {
    await initializeWorkspaceComponents(
      settings.platformSettings,
      settings.customSettings,
      components,
      log,
      config?.dockIcon,
      config?.themeToggleDarkIcon,
      config?.themeToggleLightIcon,
      config?.roles,
    );
    log("Workspace platform initialized");
  });

  // init() starts the platform and triggers "platform-api-ready" above
  await initializePlatform(settings.platformSettings, config?.theme);
}

// ─── Platform initialization ─────────────────────────────────────────

/**
 * Initialize the OpenFin workspace platform with theme config and
 * custom action handlers for the dock buttons.
 */
async function initializePlatform(
  platformSettings: PlatformSettings,
  theme?: WorkspaceConfig["theme"],
): Promise<void> {
  await init({
    browser: {
      defaultWindowOptions: {
        icon: platformSettings.icon,
        workspacePlatform: {
          pages: [],
          favicon: platformSettings.icon,
        },
      },
    },
    theme: [
      {
        label: "Default",
        default: "dark",
        palettes: {
          dark: {
            brandPrimary: theme?.brandPrimary ?? "#0A76D3",
            brandSecondary: theme?.brandSecondary ?? "#383A40",
            backgroundPrimary: theme?.backgroundPrimary ?? "#1E1F23",
          },
          light: {
            brandPrimary: theme?.brandPrimary ?? "#0A76D3",
            brandSecondary: theme?.brandSecondary ?? "#383A40",
            backgroundPrimary: "#FAFBFE",
          },
        },
      },
    ],
    customActions: {
      // ── Launch an app from a dock button or dropdown menu item ──
      // Note: computed property syntax [CONSTANT] is used throughout so
      // the action IDs are defined once in dock.ts and shared here.
      [ACTION_LAUNCH_APP]: async (e): Promise<void> => {
        if (
          e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem
        ) {
          await launchApp(e.customData as App);
        }
      },

      // ── Toggle between dark and light theme ──
      [ACTION_TOGGLE_THEME]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomButton) {
          return;
        }

        // 1. Read the current scheme and flip it
        const platform = getCurrentSync();
        const currentScheme = await platform.Theme.getSelectedScheme();
        const newScheme =
          currentScheme === ColorSchemeOptionType.Dark
            ? ColorSchemeOptionType.Light
            : ColorSchemeOptionType.Dark;

        // 2. Tell OpenFin to switch the theme (updates CSS variables).
        //    Note: We intentionally do NOT await this call because
        //    setSelectedScheme() successfully changes the theme but
        //    its returned promise never resolves (OpenFin API quirk).
        platform.Theme.setSelectedScheme(newScheme);

        // 3. Recolor all dock icons to match the new theme
        const isDark = newScheme === ColorSchemeOptionType.Dark;
        await recolorDockIcons(isDark);

        // 4. Notify child windows (e.g. dock editor) about the change.
        //    Child windows run in separate processes and cannot call
        //    our functions directly, so we use InterApplicationBus.
        try {
          await fin.InterApplicationBus.publish(IAB_THEME_CHANGED, { isDark });
        } catch (iabErr) {
          // IAB publish can fail if no child windows are subscribed — safe to ignore
          console.warn("Could not publish theme-changed event via IAB.", iabErr);
        }
      },

      // ── Open the dock editor window ──
      [ACTION_OPEN_DOCK_EDITOR]: async (e): Promise<void> => {
        if (
          e.callerType !== CustomActionCallerType.CustomButton &&
          e.callerType !== CustomActionCallerType.CustomDropdownItem
        ) {
          return;
        }

        // Try to bring an existing editor window to the front
        try {
          const existingWindow = fin.Window.wrapSync({
            uuid: fin.me.identity.uuid,
            name: "dock-editor",
          });
          await existingWindow.setAsForeground();
        } catch {
          // Window doesn't exist yet — create a new one
          const app = await fin.Application.getCurrent();
          const manifest: Record<string, unknown> = await app.getManifest();
          const platformConfig = manifest['platform'] as Record<string, string> | undefined;
          const providerUrl = platformConfig?.['providerUrl'] ?? "";

          // Extract just the origin (e.g. "http://localhost:5174") so we can
          // build the correct URL for the dock editor route.
          let origin: string;
          try {
            origin = new URL(providerUrl).origin;
          } catch {
            console.error("Could not determine app origin from providerUrl:", providerUrl);
            return;
          }

          await fin.Window.create({
            name: "dock-editor",
            url: `${origin}/dock-editor`,
            defaultWidth: 720,
            defaultHeight: 800,
            autoShow: true,
            frame: true,
            resizable: true,
            saveWindowState: true,
            contextMenu: true,
          });
        }
      },

      // ── Open the registry editor window ──
      [ACTION_OPEN_REGISTRY_EDITOR]: async (e): Promise<void> => {
        if (
          e.callerType !== CustomActionCallerType.CustomButton &&
          e.callerType !== CustomActionCallerType.CustomDropdownItem
        ) {
          return;
        }

        try {
          const existingWindow = fin.Window.wrapSync({
            uuid: fin.me.identity.uuid,
            name: "registry-editor",
          });
          await existingWindow.setAsForeground();
        } catch {
          const app = await fin.Application.getCurrent();
          const manifest: Record<string, unknown> = await app.getManifest();
          const platformConfig = manifest['platform'] as Record<string, string> | undefined;
          const providerUrl = platformConfig?.['providerUrl'] ?? "";

          let origin: string;
          try {
            origin = new URL(providerUrl).origin;
          } catch {
            console.error("Could not determine app origin from providerUrl:", providerUrl);
            return;
          }

          await fin.Window.create({
            name: "registry-editor",
            url: `${origin}/registry-editor`,
            defaultWidth: 800,
            defaultHeight: 700,
            autoShow: true,
            frame: true,
            resizable: true,
            saveWindowState: true,
            contextMenu: true,
          });
        }
      },

      // ── Reload the dock buttons from the saved config ──
      [ACTION_RELOAD_DOCK]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        console.log("Reloading dock...");
        try {
          await reloadDockFromConfig();
          console.log("Dock reloaded.");
        } catch (error) {
          console.error("Failed to reload dock.", error);
        }
      },

      // ── Open DevTools for the provider window ──
      [ACTION_SHOW_DEVTOOLS]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        try {
          const providerWindow = fin.Window.getCurrentSync();
          await providerWindow.showDeveloperTools();
        } catch (error) {
          console.error("Failed to open developer tools.", error);
        }
      },

      // ── Export all config from IndexedDB as a JSON download ──
      [ACTION_EXPORT_CONFIG]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        try {
          if (!configManager) {
            console.error("ConfigManager not initialized.");
            return;
          }

          // Gather all data from the config service tables
          const exportData = {
            appRegistry: await configManager.getAllApps(),
            appConfig: await configManager.getConfigsByApp(""),
            userProfiles: [] as any[],
            roles: await configManager.getAllRoles(),
            permissions: await configManager.getAllPermissions(),
            exportedAt: new Date().toISOString(),
          };

          // Also get all app configs (not just one appId)
          // Use a broad query — get everything in the appConfig table
          const allApps = await configManager.getAllApps();
          const allConfigs: any[] = [];
          for (const app of allApps) {
            const configs = await configManager.getConfigsByApp(app.appId);
            allConfigs.push(...configs);
          }
          // Also get configs with empty appId (like dock-config)
          const dockConfig = await configManager.loadDockConfig();
          if (dockConfig) {
            allConfigs.push({
              configId: "dock-config",
              appId: "",
              componentType: "DOCK",
              config: dockConfig,
            });
          }
          exportData.appConfig = allConfigs;

          // Trigger a file download
          const json = JSON.stringify(exportData, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `config-export-${new Date().toISOString().slice(0, 10)}.json`;
          link.click();
          URL.revokeObjectURL(url);

          console.log("Config exported.");
        } catch (error) {
          console.error("Failed to export config.", error);
        }
      },

      // ── Open the import config window ──
      [ACTION_IMPORT_CONFIG]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }

        // Open a dedicated React window for the file picker — same pattern
        // as the dock editor. A hidden provider window cannot show a native
        // file picker dialog, so we host the UI in its own OpenFin window.
        try {
          const existingWindow = fin.Window.wrapSync({
            uuid: fin.me.identity.uuid,
            name: "import-config",
          });
          await existingWindow.setAsForeground();
        } catch {
          // Window doesn't exist yet — create it
          const app = await fin.Application.getCurrent();
          const manifest: Record<string, unknown> = await app.getManifest();
          const platformConfig = manifest['platform'] as Record<string, string> | undefined;
          const providerUrl = platformConfig?.['providerUrl'] ?? "";

          let origin: string;
          try {
            origin = new URL(providerUrl).origin;
          } catch {
            console.error("Could not determine app origin from providerUrl:", providerUrl);
            return;
          }

          await fin.Window.create({
            name: "import-config",
            url: `${origin}/import-config`,
            defaultWidth: 400,
            defaultHeight: 320,
            autoShow: true,
            frame: true,
            resizable: false,
            saveWindowState: false,
            contextMenu: false,
          });
        }
      },

      // ── Toggle the provider window visibility ──
      [ACTION_TOGGLE_PROVIDER]: async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        try {
          const providerWindow = fin.Window.getCurrentSync();
          const isVisible = await providerWindow.isShowing();

          if (isVisible) {
            await providerWindow.hide();
            console.log("Provider window hidden.");
          } else {
            await providerWindow.show();
            console.log("Provider window shown.");
          }
        } catch (error) {
          console.error("Failed to toggle provider window.", error);
        }
      },
    },
  });
}

// ─── Workspace component registration ────────────────────────────────

/**
 * Register each enabled workspace component (Home, Store, Dock, Notifications)
 * and set up a cleanup handler for when the provider window is closed.
 */
async function initializeWorkspaceComponents(
  platformSettings: PlatformSettings,
  customSettings: CustomSettings | undefined,
  components: Required<NonNullable<WorkspaceConfig["components"]>>,
  log: (message: string) => void,
  dockIcon?: string,
  themeToggleDarkIcon?: string,
  themeToggleLightIcon?: string,
  roles?: string[],
): Promise<void> {
  log("Initializing workspace components");

  if (components.home) {
    log("Initializing workspace components: home");
    await registerHome(platformSettings, customSettings?.apps);
    await Home.show();
  }

  if (components.store) {
    log("Initializing workspace components: store");
    await registerStore(platformSettings, customSettings?.apps);
  }

  if (components.dock) {
    log("Initializing workspace components: dock");
    await registerDock(platformSettings, customSettings?.apps, dockIcon, themeToggleDarkIcon, themeToggleLightIcon, roles);
    await Dock.show();
  }

  if (components.notifications) {
    log("Initializing workspace components: notifications");
    await registerNotifications();
  }

  // Clean up all registered components when the provider window closes
  const providerWindow = fin.Window.getCurrentSync();
  await providerWindow.once("close-requested", async () => {
    if (components.home) await Home.deregister(platformSettings.id);
    if (components.store) await Storefront.deregister(platformSettings.id);
    if (components.dock) await Dock.deregister();

    // Clean up the config service (stops the sync drain loop)
    if (configManager) {
      configManager.dispose();
    }

    await fin.Platform.getCurrentSync().quit();
  });
}

// ─── Manifest settings ───────────────────────────────────────────────

/**
 * Read platform settings and custom settings from the OpenFin manifest.
 *
 * Platform settings (id, title, icon) come from standard manifest fields.
 * Custom settings (app list, etc.) come from the "customSettings" block
 * that we define in the manifest for our own use.
 */
async function getManifestCustomSettings(): Promise<{
  platformSettings: PlatformSettings;
  customSettings?: CustomSettings;
}> {
  const app = await fin.Application.getCurrent();
  const manifest: OpenFin.Manifest & { customSettings?: CustomSettings } = await app.getManifest();

  return {
    platformSettings: {
      id: manifest['platform']?.uuid ?? "",
      title: manifest.shortcut?.name ?? "",
      icon: manifest['platform']?.icon ?? "",
    },
    customSettings: manifest.customSettings,
  };
}
