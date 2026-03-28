import { usePlatformState } from "../hooks/usePlatformState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export function View2() {
  const [myState] = usePlatformState<string>("demo");

  return (
    <div className="flex flex-col flex-1 gap-5 p-2.5">
      <main>
        <Card>
          <CardHeader>
            <CardTitle>View 2</CardTitle>
            <CardDescription>Receives platform state from View 1</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-bold">{myState}</h2>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
