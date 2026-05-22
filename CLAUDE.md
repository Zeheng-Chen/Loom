# Loom

A web-based learning tool that replaces linear LLM chat with a mind-map structure. Each Q&A pair becomes a Block on a spatial canvas. Sub-questions branch off as child Blocks without losing the original context thread.

## Tech Stack

- **Framework**: React + TypeScript (Vite)
- **Canvas**: React Flow (`@xyflow/react`)
- **Auto-layout**: dagre (`@dagrejs/dagre`) — installed, not yet wired up
- **State**: Zustand
- **Persistence**: IndexedDB via `idb-keyval` + Zustand `persist` middleware
- **LLM**: Anthropic SDK (primary, implemented); OpenAI SDK + custom base URL (planned)
- **Markdown rendering**: `react-markdown`
- **Note Block editor**: `react-md-editor` — planned, not yet implemented

## Core Concepts

See `CONTEXT.md` for the full glossary. Key terms:

- **Block**: Atomic unit. Two types: LLM Block (question + answer + notes textarea) and Note Block (markdown editor only).
- **Tree**: Blocks form a tree within a File. Every Block has exactly one parent. Adding a child from any of 8 directions always creates a child node — direction only affects initial position.
- **Ancestor Chain**: Default LLM context — the path from the current Block up to the root Block (current → parent → … → root).
- **Merge**: User selects a parent Block + clarification child Blocks → LLM rewrites the parent answer → clarification children are deleted.
- **File**: One canvas with one root Block + optional floating Blocks.

## Data Model

```typescript
type BlockType = "llm" | "note";

interface Block {
  id: string;
  type: BlockType;
  title: string;           // defaults to question for LLM blocks
  question: string;        // LLM blocks only
  answer: string;          // LLM blocks only (Markdown)
  notes: string;           // LLM blocks only (plain text)
  content: string;         // Note blocks only (Markdown)
  parentId: string | null;
  childrenIds: string[];
  position: { x: number; y: number } | null; // null = auto-layout
  collapsed: boolean;
  createdAt: number;
}

interface LoomFile {
  id: string;
  name: string;
  rootBlockId: string;
  blocks: Record<string, Block>;
}
```

## LLM Context Construction

When the user submits a question in Block B:
1. Walk from B up to the root, collecting each Block's question + answer.
2. Send as messages: root first, current Block last.
3. Append the current Block's question as the final user turn.

```typescript
function buildAncestorChain(blockId: string, blocks: Record<string, Block>): Block[] {
  const chain: Block[] = [];
  let current = blocks[blockId];
  while (current) {
    chain.unshift(current);
    current = current.parentId ? blocks[current.parentId] : null;
  }
  return chain;
}
```

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx          # React Flow canvas wrapper + store sync
│   ├── BlockNode.tsx       # Custom React Flow node (LLM block)
│   └── SettingsPanel.tsx   # API key + model settings overlay
├── store/
│   └── index.ts            # Zustand store (blocks, file, settings)
├── lib/
│   ├── types.ts            # Block, LoomFile, AppSettings interfaces
│   ├── llm.ts              # Anthropic API call with streaming
│   └── context.ts          # Ancestor chain builder
├── App.tsx
└── main.tsx
```

*Not yet implemented: `NoteBlockNode.tsx`, `Sidebar.tsx`, `lib/layout.ts` (dagre), `lib/db.ts` (IndexedDB)*

## 功能路线图

### v0.1 MVP ✅ 已完成
- [x] React Flow 画布：创建 Block、连接父子节点、pan/zoom
- [x] 双击画布新建 Block，点 `+` 按钮新建子 Block
- [x] LLM Block：输入问题 → 调 Anthropic API → 流式渲染 Markdown 回答
- [x] 祖先链上下文自动传递给 LLM
- [x] Block 折叠/展开（折叠后只显示标题）
- [x] Block 删除：无子节点直接删，有子节点内联确认后递归删
- [x] Settings 面板：Anthropic API Key + 模型选择

### v0.2 — 画布完善（下一步）
- [ ] 从侧边栏拖拽新 Block 到画布（创建悬浮 Block）
- [ ] dagre 自动布局
- [ ] Block 标题可编辑（双击修改）
- [x] IndexedDB 持久化（刷新后不丢数据）

### v0.3 — 笔记与融合
- [ ] Block 内笔记区（textarea，已有 UI 框架）
- [ ] Note Block 类型（react-md-editor）
- [ ] Merge 功能：选中父 Block + 澄清子 Block → LLM 重新合成 → 子 Block 消失

### v0.4 — 多文件与工作区
- [ ] 多文件支持
- [ ] 文件间连接（树状）
- [ ] Graph View（Obsidian 风格导航）

### 未来
- [ ] OpenAI + 自定义 base URL 支持
- [ ] LLM 上下文自定义选取（不限于祖先链）
- [ ] 导出为 Markdown / PDF
- [ ] 云同步（可选）

## Block Deletion Logic

`deleteBlock(id, recursive?)` in the Zustand store.

- **No children**: delete the block and remove its edge from parent immediately, no confirmation needed.
- **Has children**: show an inline confirmation inside the block UI. User must explicitly confirm. On confirm, `deleteBlock(id, true)` — recursively collects the entire subtree (DFS via `childrenIds`) and deletes all at once.
- Cancelling the confirmation closes the prompt without any changes.
- Canvas sync: `Canvas.tsx` uses a `useEffect` watching `file.blocks` to keep React Flow nodes/edges in sync — removed blocks are filtered out, new blocks are added, orphaned edges (source or target no longer in store) are pruned automatically.

```typescript
// Recursive collect then batch-delete
const toDelete = new Set<string>();
const collect = (blockId: string) => {
  toDelete.add(blockId);
  blocks[blockId]?.childrenIds.forEach(collect);
};
if (recursive) collect(id); else toDelete.add(id);
```

## Key Rules

- Never send a full tree to the LLM — only the Ancestor Chain.
- A child Block added from any direction is always a child, never a sibling.
- Blocks default to expanded on creation; restore last state on file reopen.
- Block title = user's question by default; user can override.
- One question per LLM Block. No multi-turn chat inside a Block.
