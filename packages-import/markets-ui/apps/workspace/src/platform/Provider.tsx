import type OpenFin from "@openfin/core";
import { useEffect, useState } from "react";
import { Dock, Home, Storefront, type App } from "@openfin/workspace";
import { CustomActionCallerType, init } from "@openfin/workspace-platform";
import { register as registerDock } from "./dock";
import { register as registerHome } from "./home";
import { launchApp } from "./launch";
import { register as registerNotifications } from "./notifications";
import type { CustomSettings, PlatformSettings } from "./shapes";
import { register as registerStore } from "./store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

let isInitialized = false;
let logMessage: React.Dispatch<React.SetStateAction<string>>;

function Provider() {
  const [message, setMessage] = useState("");
  logMessage = setMessage;

  useEffect(() => {
    (async function () {
      if (!isInitialized) {
        isInitialized = true;
        try {
          setMessage("Workspace platform initializing");

          const settings = await getManifestCustomSettings();

          const platform = fin.Platform.getCurrentSync();
          await platform.once("platform-api-ready", async () => {
            await initializeWorkspaceComponents(
              settings.platformSettings,
              settings.customSettings,
            );
            setMessage("Workspace platform initialized");
          });

          await initializeWorkspacePlatform(settings.platformSettings);
        } catch (err) {
          console.log(err);
          setMessage(`Error Initializing Platform: ${err instanceof Error ? err.message : err}`);
        }
      }
    })();
  }, []);

  return (
    <div className="flex flex-col flex-1 gap-5">
      <header className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">OpenFin Platform Window</h1>
          <p className="text-sm text-muted-foreground">Workspace platform window</p>
        </div>
      </header>
      <main className="flex flex-col gap-2.5">
        <Card>
          <CardHeader>
            <CardTitle>Platform Provider</CardTitle>
            <CardDescription>This window initializes the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The window would usually be hidden. Set the platform.autoShow flag to false in
              manifest.fin.json to hide it on startup.
            </p>
            <p className="mt-2 font-medium">{message}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

async function initializeWorkspacePlatform(platformSettings: PlatformSettings): Promise<void> {
  logMessage("Initializing workspace platform");
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
        palette: {
          brandPrimary: "#0A76D3",
          brandSecondary: "#383A40",
          backgroundPrimary: "#1E1F23",
        },
      },
    ],
    customActions: {
      "launch-app": async (e): Promise<void> => {
        if (
          e.callerType === CustomActionCallerType.CustomButton ||
          e.callerType === CustomActionCallerType.CustomDropdownItem
        ) {
          await launchApp(e.customData as App);
        }
      },
    },
  });
}

async function initializeWorkspaceComponents(
  platformSettings: PlatformSettings,
  customSettings?: CustomSettings,
): Promise<void> {
  logMessage("Initializing the workspace components");

  logMessage("Initializing the workspace components: home");
  await registerHome(platformSettings, customSettings?.apps);
  await Home.show();

  logMessage("Initializing the workspace components: store");
  await registerStore(platformSettings, customSettings?.apps);

  logMessage("Initializing the workspace components: dock");
  await registerDock(platformSettings, customSettings?.apps);

  logMessage("Initializing the workspace components: notifications");
  await registerNotifications();

  const providerWindow = fin.Window.getCurrentSync();
  await providerWindow.once("close-requested", async () => {
    await Home.deregister(platformSettings.id);
    await Storefront.deregister(platformSettings.id);
    await Dock.deregister();
    await fin.Platform.getCurrentSync().quit();
  });
}

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

export default Provider;
