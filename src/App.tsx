import { useCallback, useEffect } from "react";
import { Canvas } from "./components/Canvas";
import { SettingsPanel } from "./components/SettingsPanel";
import { SidePanel } from "./components/SidePanel";
import { useStore } from "./store";
import "./App.css";


export default function App() {
  const { selectedBlockId, toast, setToast, addTestBlock } = useStore();

  const insertTestBlock = useCallback(() => {
    addTestBlock();
  }, [addTestBlock]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#11111b" }}>
      <div style={{
        height: 40, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 12, padding: "0 16px",
        background: "#181825", borderBottom: "1px solid #313244",
      }}>
        <span style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>Loom</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={insertTestBlock}
          style={{
            background: "#313244", border: "1px solid #45475a", borderRadius: 6,
            color: "#a6e3a1", cursor: "pointer", padding: "3px 12px", fontSize: 12,
          }}
        >
          ＋ 插入测试块
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Canvas />
          <SettingsPanel />
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            background: "#1e1e2e", border: "1px solid #313244", borderRadius: 8,
            padding: "6px 16px", color: "#585b70", fontSize: 12,
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Double-click canvas to create block · Click + on a block to add child
          </div>
        </div>
        {selectedBlockId && <SidePanel />}
      </div>

      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "#313244", border: "1px solid #f38ba8",
          borderRadius: 10, padding: "12px 20px",
          color: "#cdd6f4", fontSize: 13, maxWidth: 420, textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: "#f38ba8", fontSize: 16 }}>⚠</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} style={{
            background: "none", border: "none", color: "#585b70",
            cursor: "pointer", fontSize: 16, marginLeft: 4,
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
