import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#cdd6f4", margin: "20px 0 10px", lineHeight: 1.3 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 18, fontWeight: 600, color: "#cdd6f4", margin: "18px 0 8px", lineHeight: 1.3 }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#cdd6f4", margin: "14px 0 6px", lineHeight: 1.3 }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#bac2de", margin: "12px 0 4px" }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p style={{ margin: "0 0 12px", lineHeight: 1.75, color: "#cdd6f4", fontSize: 14 }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#cdd6f4" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 12px", paddingLeft: 20, color: "#cdd6f4" }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: "4px 0", lineHeight: 1.7, fontSize: 14 }}>{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: "12px 0",
      padding: "8px 14px",
      borderLeft: "3px solid #89b4fa",
      background: "#1e1e2e",
      borderRadius: "0 6px 6px 0",
      color: "#a6adc8",
      fontStyle: "italic",
    }}>{children}</blockquote>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: "#cdd6f4" }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: "#cba6f7", fontStyle: "italic" }}>{children}</em>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: "#89b4fa", textDecoration: "underline" }}>{children}</a>
  ),
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid #313244", margin: "16px 0" }} />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      padding: "8px 12px", textAlign: "left", fontWeight: 600,
      background: "#313244", color: "#cdd6f4",
      border: "1px solid #45475a",
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: "7px 12px", color: "#cdd6f4",
      border: "1px solid #313244",
    }}>{children}</td>
  ),
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid #313244" }}>{children}</tr>
  ),
  // Inline code
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className ?? "");

    if (match) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: 8,
            margin: "10px 0",
            fontSize: 13,
            padding: "14px 16px",
            background: "#11111b",
            border: "1px solid #313244",
          }}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    }

    return (
      <code style={{
        background: "#313244",
        color: "#a6e3a1",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: "0.88em",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        {children}
      </code>
    );
  },
};

interface Props {
  children: string;
}

export function MarkdownRenderer({ children }: Props) {
  return (
    <div style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
