import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

function View2() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function listenForFDC3Context() {
      if (window.fdc3) {
        console.log("Listen for FDC3 User Context");
        await fdc3.addContextListener(null, (context) => {
          setMessage(JSON.stringify(context, undefined, "  "));
        });
      } else {
        window.addEventListener("fdc3Ready", listenForFDC3Context);
      }
    }

    async function listenForFDC3ContextAppChannel() {
      if (window.fdc3) {
        const appChannel = await fdc3.getOrCreateChannel("CUSTOM-APP-CHANNEL");
        console.log("Listen for FDC3 App Context");
        await appChannel.addContextListener(null, (context) => {
          setMessage(JSON.stringify(context, undefined, "  "));
        });
      } else {
        window.addEventListener("fdc3Ready", listenForFDC3ContextAppChannel);
      }
    }

    (async function () {
      console.log("View2 mounted");
      await listenForFDC3Context();
      await listenForFDC3ContextAppChannel();
    })();
  }, []);

  return (
    <div className="flex flex-col flex-1 gap-5">
      <header className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">OpenFin React View 2</h1>
          <p className="text-sm text-muted-foreground">React app view in an OpenFin container</p>
        </div>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>FDC3 Context Listener</CardTitle>
            <CardDescription>Receives broadcast context from View 1</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <pre className="w-full min-h-[110px] rounded-md bg-muted p-3 font-mono text-sm">
              {message}
            </pre>
            <Button variant="outline" onClick={() => setMessage("")}>
              Clear
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default View2;
