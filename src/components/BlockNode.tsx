import { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useStore } from "../store";
import { askLLM } from "../lib/llm";

function getPreview(text: string): string {
  const stripped = text
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`[^`]+`/g, "[code]")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return stripped.length > 120 ? stripped.slice(0, 120) + "…" : stripped;
}

const SIDES = [Position.Top, Position.Bottom, Position.Left, Position.Right];

export function BlockNode({ id }: NodeProps) {
  const { file, settings, updateBlock, addBlock, deleteBlock, expandBlock, setSelectedBlock, selectedBlockId, setToast } = useStore();
  const block = file.blocks[id];
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = useCallback(() => {
    if (block.childrenIds.length > 0) {
      setConfirmDelete(true);
    } else {
      deleteBlock(id, false);
    }
  }, [block, id, deleteBlock]);

  const handleAsk = useCallback(async () => {
    if (!inputValue.trim() || loading) return;
    const question = inputValue.trim();
    setInputValue("");
    setLoading(true);
    setStreamingAnswer("");
    updateBlock(id, { question, title: question });

    let full = "";
    try {
      await askLLM(question, id, file.blocks, settings, (chunk) => {
        full += chunk;
        setStreamingAnswer(full);
      });
      updateBlock(id, { answer: full });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const isCredit = msg.toLowerCase().includes("credit") || msg.includes("402") || msg.includes("balance");
      setToast(isCredit
        ? "API 额度不足，请前往 console.anthropic.com 充值后重试"
        : `请求失败：${msg}`
      );
    } finally {
      setLoading(false);
      setStreamingAnswer("");
    }
  }, [inputValue, loading, id, file.blocks, settings, updateBlock]);

  const handleAddChild = useCallback(() => {
    addBlock(id);
  }, [id, addBlock]);

  if (!block) return null;

  const isSelected = selectedBlockId === id;
  const displayAnswer = loading ? streamingAnswer : block.answer;
  const preview = displayAnswer ? getPreview(displayAnswer) : null;

  return (
    <div
      onClick={() => setSelectedBlock(id)}
      style={{
        background: "#1e1e2e",
        border: `1px solid ${isSelected ? "#89b4fa" : "#45475a"}`,
        borderRadius: 12,
        padding: 16,
        minWidth: 280,
        maxWidth: 380,
        color: "#cdd6f4",
        fontFamily: "sans-serif",
        fontSize: 14,
        boxShadow: isSelected ? "0 0 0 2px #89b4fa40" : "0 4px 20px rgba(0,0,0,0.4)",
        cursor: "pointer",
      }}
    >
      {SIDES.map((pos) => (
        <Handle key={`s-${pos}`} id={`source-${pos}`} type="source" position={pos} style={{ opacity: 0.4 }} />
      ))}
      {SIDES.map((pos) => (
        <Handle key={`t-${pos}`} id={`target-${pos}`} type="target" position={pos} style={{ opacity: 0.4 }} />
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: block.type === "note" ? "#a6e3a1" : "#89b4fa", textTransform: "uppercase", letterSpacing: 1 }}>
          {block.type === "note" ? "Note" : "Block"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); updateBlock(id, { collapsed: !block.collapsed }); }}
            style={btnStyle}
            title={block.collapsed ? "Expand" : "Collapse"}
          >
            {block.collapsed ? "▶" : "▼"}
          </button>
          {block.type === "llm" && block.answer && (
            <button
              onClick={(e) => { e.stopPropagation(); expandBlock(id); }}
              style={btnStyle}
              title="Expand answer into child blocks"
            >
              ⊞
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleAddChild(); }} style={btnStyle} title="Add child block">
            +
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} style={{ ...btnStyle, color: "#f38ba8" }} title="Delete block">
            ✕
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="nodrag" style={{
          background: "#181825", border: "1px solid #f38ba8",
          borderRadius: 8, padding: 12, marginBottom: 8,
        }}>
          <p style={{ color: "#f38ba8", fontSize: 13, marginBottom: 8 }}>
            此 Block 有 {block.childrenIds.length} 个子节点，一并删除？
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { deleteBlock(id, true); }}
              style={{ ...btnStyle, background: "#f38ba8", color: "#1e1e2e", fontWeight: 700, flex: 1 }}
            >
              全部删除
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ ...btnStyle, flex: 1 }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {block.collapsed ? (
        <div style={{ color: "#cdd6f4", fontWeight: 500 }}>
          {block.title || "Empty block"}
        </div>
      ) : block.type === "note" ? (
        <>
          <div style={{ color: "#cdd6f4", fontWeight: 600, marginBottom: 6 }}>
            {block.title}
          </div>
          {block.content && (
            <div style={{ color: "#a6adc8", fontSize: 13, lineHeight: 1.5 }}>
              {block.content.length > 160 ? block.content.slice(0, 160) + "…" : block.content}
            </div>
          )}
        </>
      ) : (
        <>
          {!block.answer && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask a question..."
                className="nodrag"
                style={inputStyle}
              />
              <button onClick={handleAsk} disabled={loading} style={sendBtnStyle}>
                {loading ? "…" : "→"}
              </button>
            </div>
          )}

          {block.question && (
            <div style={{ marginBottom: 8, color: "#89dceb", fontWeight: 500 }}>
              {block.question}
            </div>
          )}

          {preview && (
            <div style={{ color: "#a6adc8", fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
              {preview}
              {loading && <span style={{ color: "#89b4fa" }}>▌</span>}
            </div>
          )}

          {block.answer && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#585b70" }}>
              Click to read full answer →
            </div>
          )}

          <textarea
            value={block.notes}
            onChange={(e) => updateBlock(id, { notes: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Your notes..."
            className="nodrag"
            style={{
              marginTop: 8,
              width: "100%",
              minHeight: 56,
              background: "#181825",
              border: "1px solid #313244",
              borderRadius: 8,
              color: "#a6adc8",
              padding: "6px 10px",
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              fontFamily: "sans-serif",
            }}
          />
        </>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#313244",
  border: "1px solid #45475a",
  borderRadius: 6,
  color: "#cdd6f4",
  cursor: "pointer",
  padding: "2px 8px",
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "#313244",
  border: "1px solid #45475a",
  borderRadius: 8,
  color: "#cdd6f4",
  padding: "6px 10px",
  fontSize: 13,
  outline: "none",
};

const sendBtnStyle: React.CSSProperties = {
  background: "#89b4fa",
  border: "none",
  borderRadius: 8,
  color: "#1e1e2e",
  cursor: "pointer",
  padding: "6px 12px",
  fontWeight: 700,
  fontSize: 16,
};

