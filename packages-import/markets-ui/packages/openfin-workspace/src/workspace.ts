/* eslint-disable @typescript-eslint/no-explicit-any */
declare const fin: any;
import type OpenFin from "@openfin/core";
import { Dock, Home, Storefront, type App } from "@openfin/workspace";
import { ColorSchemeOptionType, CustomActionCallerType, getCurrentSync, init } from "@openfin/workspace-platform";
import { createConfigManager, type ConfigManager } from "@marketsui/config-service";
import { setConfigManager } from "./db";
import { registerDock, recolorDockIcons } from "./dock";
import { registerHome } from "./home";
import { launchApp } from "./launch";
import { registerNotifications } from "./notifications";
import { registerStore } from "./store";
import type { CustomSettings, PlatformSettings, WorkspaceConfig } from "./types";

/** Prevents initWorkspace() from being called more than once. */
let isInitialized = false;

/** The shared ConfigManager instance, created during platform init. */
let configManager: ConfigManager | undefined;

// ─── Cached init parameters ─────────────────────────────────────────
// Stored at module level so that custom action handlers (reload-dock,
// import-config) can re-register the dock with the same settings.
let cachedPlatformSettings: PlatformSettings | undefined;
let cachedCustomSettings: CustomSettings | undefined;
let cachedDockIcon: string | undefined;
let cachedThemeToggleDarkIcon: string | undefined;
let cachedThemeToggleLightIcon: string | undefined;
let cachedRoles: string[] | undefined;

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
    // Cache init params so action handlers (reload-dock, import-config)
    // can re-register the dock with the same settings.
    cachedPlatformSettings = settings.platformSettings;
    cachedCustomSettings = settings.customSettings;
    cachedDockIcon = config?.dockIcon;
    cachedThemeToggleDarkIcon = config?.themeToggleDarkIcon;
    cachedThemeToggleLightIcon = config?.themeToggleLightIcon;
    cachedRoles = config?.roles;

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
  await initializePlatform(settings.platformSettings, config?.theme, config?.customActions);
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
      "launch-app": async (e): Promise<void> => {
        if (
          e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem
        ) {
          await launchApp(e.customData as App);
        }
      },

      // ── Toggle between dark and light theme ──
      "toggle-theme": async (e): Promise<void> => {
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
          await fin.InterApplicationBus.publish("theme-changed", { isDark });
        } catch {
          // IAB may not be available if no child windows are open
        }
      },

      // ── Open the dock editor window ──
      "open-dock-editor": async (e): Promise<void> => {
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
          const platformConfig = manifest.platform as Record<string, string> | undefined;
          const providerUrl = platformConfig?.providerUrl ?? "";

          // Use only the origin (e.g. http://localhost:5174), not the full path
          const origin = new URL(providerUrl).origin;

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

      // ── Reload the dock (deregister and re-register) ──
      "reload-dock": async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        console.log("Reloading dock...");
        try {
          await Dock.deregister();
          await registerDock(
            cachedPlatformSettings!,
            cachedCustomSettings?.apps,
            cachedDockIcon,
            cachedThemeToggleDarkIcon,
            cachedThemeToggleLightIcon,
            cachedRoles,
          );
          await Dock.show();
          console.log("Dock reloaded.");
        } catch (error) {
          console.error("Failed to reload dock.", error);
        }
      },

      // ── Open DevTools for the provider window ──
      "show-devtools": async (e): Promise<void> => {
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
      "export-config": async (e): Promise<void> => {
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

      // ── Import config from a previously exported JSON file ──
      "import-config": async (e): Promise<void> => {
        if (e.callerType !== CustomActionCallerType.CustomDropdownItem) {
          return;
        }
        try {
          if (!configManager) {
            console.error("ConfigManager not initialized.");
            return;
          }

          // Create a hidden file input and trigger it
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";

          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
              const text = await file.text();
              const importData = JSON.parse(text);

              // Import dock config if present
              if (importData.appConfig && Array.isArray(importData.appConfig)) {
                for (const config of importData.appConfig) {
                  if (config.configId === "dock-config" && config.config) {
                    await configManager!.saveDockConfig(config.config);
                  } else if (config.configId) {
                    await configManager!.saveConfig(config);
                  }
                }
              }

              console.log("Config imported. Reloading dock...");

              // Reload the dock to reflect imported config
              await Dock.deregister();
              await registerDock(
                cachedPlatformSettings!,
                cachedCustomSettings?.apps,
                cachedDockIcon,
                cachedThemeToggleDarkIcon,
            cachedThemeToggleLightIcon,
                cachedRoles,
              );
              await Dock.show();
            } catch (parseError) {
              console.error("Failed to parse import file.", parseError);
            }
          };

          input.click();
        } catch (error) {
          console.error("Failed to import config.", error);
        }
      },

      // ── Toggle the provider window visibility ──
      "toggle-provider-window": async (e): Promise<void> => {
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
      id: manifest.platform?.uuid ?? "",
      title: manifest.shortcut?.name ?? "",
      icon: manifest.platform?.icon ?? "",
    },
    customSettings: manifest.customSettings,
  };
}
