import { usePlatformState } from "../hooks/usePlatformState";
import { useRaiseIntent } from "../hooks/useRaiseIntent";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export function View1() {
  const raiseIntent = useRaiseIntent();
  const [, setMyState] = usePlatformState<string>("demo", "");

  const handleViewContact = () => {
    raiseIntent("ViewContact", { type: "fdc3.contact" });
  };

  const handleViewQuote = () => {
    raiseIntent("ViewQuote", { type: "custom.instrument" });
  };

  const handleSetGlobalState = () => {
    setMyState("Hello World!");
  };

  return (
    <div className="flex flex-col flex-1 gap-5 p-2.5">
      <main>
        <Card>
          <CardHeader>
            <CardTitle>View 1</CardTitle>
            <CardDescription>FDC3 Intents and Platform State</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={handleViewContact}>View Contact</Button>
            <Button variant="secondary" onClick={handleViewQuote}>View Quote</Button>
            <Button variant="outline" onClick={handleSetGlobalState}>Set global state</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
