import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

function View1() {
  async function broadcastFDC3Context() {
    if (window.fdc3) {
      await fdc3.broadcast({
        type: "fdc3.instrument",
        name: "Microsoft Corporation",
        id: {
          ticker: "MSFT",
        },
      });
    } else {
      console.error("FDC3 is not available");
    }
  }

  async function broadcastFDC3ContextAppChannel() {
    if (window.fdc3) {
      const appChannel = await fdc3.getOrCreateChannel("CUSTOM-APP-CHANNEL");
      await appChannel.broadcast({
        type: "fdc3.instrument",
        name: "Apple Inc.",
        id: {
          ticker: "AAPL",
        },
      });
    } else {
      console.error("FDC3 is not available");
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-5">
      <header className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">OpenFin React View 1</h1>
          <p className="text-sm text-muted-foreground">React app view in an OpenFin container</p>
        </div>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>FDC3 Broadcasting</CardTitle>
            <CardDescription>Broadcast instrument context to other views</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => broadcastFDC3Context()}>Broadcast FDC3 User Context</Button>
            <Button variant="secondary" onClick={() => broadcastFDC3ContextAppChannel()}>
              Broadcast FDC3 App Context
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default View1;
