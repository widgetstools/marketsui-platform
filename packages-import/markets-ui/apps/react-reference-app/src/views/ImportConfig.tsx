/* eslint-disable @typescript-eslint/no-explicit-any */
declare const fin: any;

import { useState, useRef } from "react";
import { loadDockConfig, saveDockConfig } from "@markets/openfin-workspace";

// ─── Types ───────────────────────────────────────────────────────────

type ImportStatus = "idle" | "success" | "error";

// ─── Component ───────────────────────────────────────────────────────

/**
 * ImportConfig — hosted in a small OpenFin window at /import-config.
 *
 * Lets the user upload a JSON file previously exported via "Export Config".
 * On successful import it reloads the dock and closes this window.
 */
export default function ImportConfig() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle file selection ─────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("idle");
    setMessage("");

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Import dock config — look for the "dock-config" entry inside appConfig[]
      if (importData.appConfig && Array.isArray(importData.appConfig)) {
        for (const row of importData.appConfig) {
          if (row.configId === "dock-config" && row.config) {
            await saveDockConfig(row.config);
          }
        }
      }

      // Tell the provider to reload the dock
      if (typeof fin !== "undefined") {
        await fin.InterApplicationBus.publish("reload-dock-after-import", {});
      }

      setStatus("success");
      setMessage("Config imported successfully. The dock has been reloaded.");

      // Auto-close after 1.5 s
      setTimeout(async () => {
        if (typeof fin !== "undefined") {
          await fin.Window.getCurrentSync().close();
        }
      }, 1500);
    } catch (err) {
      console.error("Import failed:", err);
      setStatus("error");
      setMessage("Failed to parse the file. Make sure it is a valid config export.");
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  const accentColor = "#2196F3";
  const dangerColor = "#EF5350";
  const successColor = "#00E5A0";
  const bg = "#0D1117";
  const surface = "#161B22";
  const border = "#30363D";
  const textPrimary = "#E6EDF3";
  const textSecondary = "#8B949E";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: bg, color: textPrimary,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24, padding: 32,
    }}>
      {/* Icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: surface, border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: textPrimary }}>
          Import Config
        </h1>
        <p style={{ fontSize: 13, color: textSecondary, margin: "6px 0 0" }}>
          Select a previously exported config JSON file
        </p>
      </div>

      {/* Drop zone / file button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: "100%", maxWidth: 320,
          border: `1.5px dashed ${fileName ? accentColor : border}`,
          borderRadius: 10, padding: "20px 16px",
          textAlign: "center", cursor: "pointer",
          background: fileName ? `${accentColor}10` : surface,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}10`; }}
        onMouseLeave={e => {
          if (!fileName) {
            e.currentTarget.style.borderColor = border;
            e.currentTarget.style.background = surface;
          }
        }}
      >
        {fileName ? (
          <span style={{ fontSize: 13, color: accentColor, fontWeight: 500 }}>
            {fileName}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: textSecondary }}>
            Click to select a <strong style={{ color: textPrimary }}>.json</strong> file
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Status message */}
      {message && (
        <p style={{
          fontSize: 13, textAlign: "center", margin: 0,
          color: status === "success" ? successColor : dangerColor,
        }}>
          {message}
        </p>
      )}

      {/* Close button */}
      <button
        onClick={async () => {
          if (typeof fin !== "undefined") {
            await fin.Window.getCurrentSync().close();
          }
        }}
        style={{
          padding: "8px 24px", fontSize: 13, fontWeight: 500,
          border: `1px solid ${border}`, borderRadius: 7,
          background: "transparent", color: textSecondary,
          cursor: "pointer", transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = textSecondary; e.currentTarget.style.color = textPrimary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textSecondary; }}
      >
        Cancel
      </button>
    </div>
  );
}
