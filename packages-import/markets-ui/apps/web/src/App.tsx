import { Card, CardHeader, CardTitle, CardDescription } from "./components/ui/card";

function App() {
  return (
    <>
      <header className="flex flex-row justify-between items-center mb-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Web Layout Basic Example</h1>
          <p className="text-sm text-muted-foreground">
            Demonstrate a very basic layout with generic content
          </p>
        </div>
      </header>
      <main id="layout_container" className="flex-1" />
    </>
  );
}

export default App;
