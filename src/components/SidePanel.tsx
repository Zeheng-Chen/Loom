import { useStore } from "../store";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function SidePanel() {
  const { file, selectedBlockId, setSelectedBlock } = useStore();
  const block = selectedBlockId ? file.blocks[selectedBlockId] : null;

  if (!block) return null;

  return (
    <div style={{
      width: "38.2%",
      height: "100vh",
      background: "#181825",
      borderLeft: "1px solid #313244",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #313244",
      }}>
        <span style={{ fontSize: 12, color: "#89b4fa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Block Detail
        </span>
        <button
          onClick={() => setSelectedBlock(null)}
          style={{
            background: "none", border: "none", color: "#585b70",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Question */}
        {block.question && (
          <div style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#1e1e2e",
            borderRadius: 8,
            borderLeft: "3px solid #89dceb",
          }}>
            <div style={{ fontSize: 11, color: "#585b70", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              Question
            </div>
            <div style={{ color: "#89dceb", fontWeight: 500, fontSize: 14 }}>
              {block.question}
            </div>
          </div>
        )}

        {/* Answer */}
        {block.answer ? (
          <MarkdownRenderer>{block.answer}</MarkdownRenderer>
        ) : (
          <div style={{ color: "#45475a", fontSize: 13, fontStyle: "italic" }}>
            No answer yet.
          </div>
        )}
      </div>

    </div>
  );
}
