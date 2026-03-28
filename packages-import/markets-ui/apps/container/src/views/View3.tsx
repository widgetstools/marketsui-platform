import * as Notifications from "@openfin/notifications";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

function View3() {
  useEffect(() => {
    Notifications.register().then(() => {
      Notifications.addEventListener("notification-action", (event) => {
        console.log("Notification clicked:", event.result["customData"]);
      });
    });
  }, []);

  async function showNotification() {
    await Notifications.create({
      platform: fin.me.identity.uuid,
      title: "Simple Notification",
      body: "This is a simple notification",
      toast: "transient",
      buttons: [
        {
          title: "Click me",
          type: "button",
          cta: true,
          onClick: {
            customData: "Arbitrary custom data",
          },
        },
      ],
    });
  }

  return (
    <div className="flex flex-col flex-1 gap-5">
      <header className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">OpenFin React View 3</h1>
          <p className="text-sm text-muted-foreground">React app view in an OpenFin container</p>
        </div>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>OpenFin notification demos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => showNotification()}>Show Notification</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default View3;
