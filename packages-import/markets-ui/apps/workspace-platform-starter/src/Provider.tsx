import { useOpenFin } from "./hooks/useOpenFin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";

export function Provider() {
  useOpenFin();

  return (
    <div className="flex flex-col flex-1 gap-5 p-2.5">
      <main>
        <Card>
          <CardHeader>
            <CardTitle>OpenFin Platform Provider</CardTitle>
            <CardDescription>Workspace Platform Starter</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The window would usually be hidden. Set the platform.autoShow flag to false in
              manifest.fin.json to hide it on startup.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
