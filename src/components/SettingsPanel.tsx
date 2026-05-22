import { useState } from "react";
import { useStore } from "../store";

export function SettingsPanel() {
  const { settings, updateSettings } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", top: 16, right: 16, zIndex: 100,
          background: "#313244", border: "1px solid #45475a",
          borderRadius: 8, color: "#cdd6f4", cursor: "pointer",
          padding: "6px 14px", fontSize: 13,
        }}
      >
        ⚙ Settings
      </button>

      {open && (
        <div style={{
          position: "fixed", top: 56, right: 16, zIndex: 100,
          background: "#1e1e2e", border: "1px solid #45475a",
          borderRadius: 12, padding: 20, width: 320, color: "#cdd6f4",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#89b4fa" }}>Settings</h3>

          <label style={labelStyle}>Anthropic API Key</label>
          <input
            type="password"
            value={settings.anthropicApiKey}
            onChange={(e) => updateSettings({ anthropicApiKey: e.target.value, provider: "anthropic" })}
            placeholder="sk-ant-..."
            style={inputStyle}
          />

          <label style={labelStyle}>Model</label>
          <select
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="claude-opus-4-5">claude-opus-4-5</option>
            <option value="claude-sonnet-4-5">claude-sonnet-4-5</option>
            <option value="claude-haiku-4-5-20251001">claude-haiku-4-5</option>
          </select>

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 12, width: "100%", background: "#89b4fa",
              border: "none", borderRadius: 8, color: "#1e1e2e",
              cursor: "pointer", padding: "8px 0", fontWeight: 700,
            }}
          >
            Save
          </button>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, color: "#a6adc8", marginBottom: 4, marginTop: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#313244", border: "1px solid #45475a",
  borderRadius: 8, color: "#cdd6f4", padding: "6px 10px", fontSize: 13,
  boxSizing: "border-box", outline: "none",
};
