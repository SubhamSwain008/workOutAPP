import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";

// On web (dev/browser), jeep-sqlite is required to provide an in-browser
// SQLite shim. Native Android uses the system SQLite directly.
if (Capacitor.getPlatform() === "web") {
  defineJeepSqlite(window);
}

// On native, push the WebView below the status bar so our content doesn't
// disappear under the notch / dynamic island, and pick an icon color that
// matches the active theme.
if (Capacitor.isNativePlatform()) {
  void (async () => {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      const dark = document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
      await StatusBar.setBackgroundColor({ color: dark ? "#0e0f12" : "#f7f7fa" });
    } catch {
      /* status bar plugin not available — fine on web */
    }
  })();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
