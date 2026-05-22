import { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import { useStore } from "../store";
import { askLLM } from "../lib/llm";

const DIRECTIONS = [
  { position: Position.Top, style: {} },
  { position: Position.Bottom, style: {} },
  { position: Position.Left, style: {} },
  { position: Position.Right, style: {} },
];

export function BlockNode({ id }: NodeProps) {
  const { file, settings, updateBlock, addBlock, deleteBlock } = useStore();
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
      const msg = e instanceof Error ? e.message : "Error";
      updateBlock(id, { answer: `**Error:** ${msg}` });
    } finally {
      setLoading(false);
      setStreamingAnswer("");
    }
  }, [inputValue, loading, id, file.blocks, settings, updateBlock]);

  const handleAddChild = useCallback(() => {
    addBlock(id);
  }, [id, addBlock]);

  if (!block) return null;

  const displayAnswer = loading ? streamingAnswer : block.answer;

  return (
    <div
      style={{
        background: "#1e1e2e",
        border: "1px solid #45475a",
        borderRadius: 12,
        padding: 16,
        minWidth: 280,
        maxWidth: 380,
        color: "#cdd6f4",
        fontFamily: "sans-serif",
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {DIRECTIONS.map(({ position }) => (
        <Handle key={position} type="source" position={position} style={{ opacity: 0.4 }} />
      ))}
      <Handle type="target" position={Position.Top} style={{ opacity: 0.4 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: "#89b4fa", textTransform: "uppercase", letterSpacing: 1 }}>
          Block
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => updateBlock(id, { collapsed: !block.collapsed })}
            style={btnStyle}
            title={block.collapsed ? "Expand" : "Collapse"}
          >
            {block.collapsed ? "▶" : "▼"}
          </button>
          <button onClick={handleAddChild} style={btnStyle} title="Add child block">
            +
          </button>
          <button onClick={handleDelete} style={{ ...btnStyle, color: "#f38ba8" }} title="Delete block">
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

          {displayAnswer && (
            <div style={{ color: "#cdd6f4", lineHeight: 1.6 }} className="nodrag">
              <ReactMarkdown>{displayAnswer}</ReactMarkdown>
              {loading && <span style={{ color: "#89b4fa" }}>▌</span>}
            </div>
          )}

          {block.answer && (
            <textarea
              value={block.notes}
              onChange={(e) => updateBlock(id, { notes: e.target.value })}
              placeholder="Your notes..."
              className="nodrag"
              style={notesStyle}
            />
          )}
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

const notesStyle: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  minHeight: 60,
  background: "#181825",
  border: "1px solid #313244",
  borderRadius: 8,
  color: "#a6adc8",
  padding: "6px 10px",
  fontSize: 12,
  resize: "vertical",
  boxSizing: "border-box",
};
