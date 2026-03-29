import { useEffect, useState } from "react";
import { initWorkspace } from "@markets/openfin-workspace";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

function Provider() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    initWorkspace({
      dockIcon: "http://localhost:5174/dock-provider.png",
      themeToggleDarkIcon: "http://localhost:5174/theme-dark.png",
      themeToggleLightIcon: "http://localhost:5174/theme-light.png",
      onProgress: setMessage,
      roles: ['admin', 'developer'],
    });
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

export default Provider;
