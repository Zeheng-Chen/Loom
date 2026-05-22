# Loom

A web-based learning tool that replaces linear LLM chat with a mind-map structure. Each Q&A pair becomes a Block on a spatial canvas. Sub-questions branch off as child Blocks without losing the original context thread.

## Tech Stack

- **Framework**: React + TypeScript (Vite)
- **Canvas**: React Flow (`@xyflow/react`)
- **Auto-layout**: dagre (`@dagrejs/dagre`)
- **State**: Zustand
- **Persistence**: IndexedDB (no backend, no account)
- **LLM**: Anthropic SDK (primary), OpenAI SDK + custom base URL (secondary)
- **Markdown rendering**: `react-markdown`
- **Note Block editor**: `react-md-editor`

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

interface File {
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
│   ├── Canvas.tsx          # React Flow canvas wrapper
│   ├── BlockNode.tsx       # Custom React Flow node (LLM block)
│   ├── NoteBlockNode.tsx   # Custom React Flow node (note block)
│   └── Sidebar.tsx         # File list + drag-to-create new block
├── store/
│   └── index.ts            # Zustand store (blocks, files, settings)
├── lib/
│   ├── llm.ts              # Anthropic + OpenAI API calls
│   ├── context.ts          # Ancestor chain builder
│   ├── layout.ts           # dagre auto-layout
│   └── db.ts               # IndexedDB persistence
├── App.tsx
└── main.tsx
```

## MVP Scope (Build Night target)

- [ ] React Flow canvas: create Blocks, connect parent/child, pan/zoom
- [ ] Add child Block from 8 directional handles on each Block
- [ ] Drag new Block from sidebar onto canvas (creates floating Block)
- [ ] LLM Block: type question → call Anthropic API → render Markdown answer
- [ ] Ancestor Chain context passed to LLM automatically
- [ ] Collapse/expand Blocks (title-only when collapsed)
- [ ] API Key input (Anthropic)
- [ ] Persist to IndexedDB

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
