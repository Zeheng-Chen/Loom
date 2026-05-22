import { Canvas } from "./components/Canvas";
import { SettingsPanel } from "./components/SettingsPanel";
import "./App.css";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#11111b" }}>
      <Canvas />
      <SettingsPanel />
      <div style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        background: "#1e1e2e", border: "1px solid #313244", borderRadius: 8,
        padding: "6px 16px", color: "#585b70", fontSize: 12,
        pointerEvents: "none",
      }}>
        Double-click canvas to create block · Click + on a block to add child
      </div>
    </div>
  );
}
