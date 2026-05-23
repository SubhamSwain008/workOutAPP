import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// On web (dev/browser), jeep-sqlite is required to provide an in-browser
// SQLite shim. Native Android uses the system SQLite directly.
if (Capacitor.getPlatform() === "web") {
  defineJeepSqlite(window);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
