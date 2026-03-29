import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import "./index.css";

const Provider = React.lazy(() => import("./platform/Provider"));
const View1 = React.lazy(() => import("./views/View1"));
const View2 = React.lazy(() => import("./views/View2"));
const DockEditor = React.lazy(() => import("./views/DockEditor"));
const ImportConfig = React.lazy(() => import("./views/ImportConfig"));

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/views/view1" element={<View1 />} />
        <Route path="/views/view2" element={<View2 />} />
        <Route path="/platform/provider" element={<Provider />} />
        <Route path="/dock-editor" element={<React.Suspense fallback={<div>Loading...</div>}><DockEditor /></React.Suspense>} />
        <Route path="/import-config" element={<React.Suspense fallback={<div>Loading...</div>}><ImportConfig /></React.Suspense>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
