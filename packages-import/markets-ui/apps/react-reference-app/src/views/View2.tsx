import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

function View2() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async function () {
      await listenForFDC3Context();
      await listenForFDC3ContextAppChannel();
    })();
  }, []);

  async function listenForFDC3Context() {
    if (fdc3) {
      await fdc3.addContextListener((context) => {
        setMessage(JSON.stringify(context, undefined, "  "));
      });
    } else {
      console.error("FDC3 is not available");
    }
  }

  async function listenForFDC3ContextAppChannel() {
    if (fdc3) {
      const appChannel = await fdc3.getOrCreateChannel("CUSTOM-APP-CHANNEL");
      await appChannel.addContextListener((context) => {
        setMessage(JSON.stringify(context, undefined, "  "));
      });
    } else {
      console.error("FDC3 is not available");
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-5">
      <header className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">OpenFin React View 2</h1>
          <p className="text-sm text-muted-foreground">React app view in an OpenFin workspace</p>
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
