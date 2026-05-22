# Loom

A web-based learning tool that replaces the linear LLM chat model with a mind-map structure. Each Q&A pair becomes a Block on a spatial canvas, allowing users to branch off sub-questions without losing the original context thread.

---

## Problem

Traditional LLM chat is a straight line. When learning, the user inevitably encounters a concept they don't understand mid-explanation and asks a follow-up. That follow-up buries the original answer. The mental thread is lost.

Loom solves this by making the conversation spatial: sub-questions branch off to the side, the main thread stays visible, and the tree structure itself becomes the study notes.

---

## Language

**Block**
The atomic unit of the canvas. Every piece of content — whether a Q&A exchange or a personal note — lives inside a Block. All Blocks are structurally identical; visual differences (shape, color) are user-defined style choices, not distinct types.
_Avoid_: Node, Card, Cell

**LLM Block**
A Block whose primary content is a single Q&A exchange with an LLM. Contains two sections: the LLM Conversation Area (one question + one answer) and the Notes Area (plain textarea for the user's own thoughts).
_Avoid_: Chat Block, AI Block

**Note Block**
A Block that contains only user-written content, with no LLM conversation. Uses a Markdown editor (react-md-editor). Used for longer summaries, outlines, or personal reflections that don't fit in the Notes Area of an LLM Block.
_Avoid_: Text Block, Manual Block

**Title**
The single line of text shown when a Block is collapsed. Defaults to the user's question for LLM Blocks, or user-defined for Note Blocks. The user can override it at any time.
_Avoid_: Label, Heading, Name

**Tree**
The hierarchical structure of Blocks within a File. Every Block except the Root has exactly one Parent. A Block can have any number of Children. The spatial direction used to create a child does not affect the hierarchy — it only determines the child's initial position on the Canvas.
_Avoid_: Graph, Map (when referring to the within-file structure)

**Root Block**
The single top-level Block in a File's Tree. Every File has exactly one Root Block (plus optional Floating Blocks).
_Avoid_: Central Node, Parent Node (too generic)

**Floating Block**
A Block that exists on a File's Canvas but is not connected to the Tree. Created by dragging a new Block from the sidebar onto empty canvas space.
_Avoid_: Orphan Node, Disconnected Block

**Ancestor Chain**
The ordered sequence of Blocks from the current Block up to the Root Block (current → parent → grandparent → … → root). This is the default context sent to the LLM when the user asks a question in a Block.
_Avoid_: Context Chain, Parent Path

**Merge**
The action of synthesizing a Parent Block and one or more Clarification Children into a single improved Block. The LLM rewrites the parent's answer using the clarification exchanges as input. The Clarification Children are deleted after the merge.
_Avoid_: Collapse, Combine

**Clarification Child**
A child Block created because the user did not understand the parent's answer and needed a rephrasing, example, or simpler explanation. Distinguished by intent (temporary scaffolding), not by data model. Becomes a candidate for Merge once understanding is reached.
_Avoid_: Follow-up Block (too broad — a genuine sub-topic follow-up is not a Clarification Child)

**File**
A named canvas containing one Tree (with a single Root Block) and zero or more Floating Blocks. The primary unit of persistence, stored in IndexedDB.
_Avoid_: Document, Page, Note

**Workspace**
The collection of all Files. Files in a Workspace can be linked to each other, forming an inter-file Tree navigable via the Graph View.
_Avoid_: Project, Vault

**Graph View**
The navigation interface that shows all Files in the Workspace as nodes and their inter-file links as edges — an Obsidian-style overview. Distinct from the Canvas, which shows the within-file Block tree.
_Avoid_: Overview Map, File Map

**Canvas**
The infinite spatial surface within a File where Blocks are positioned and connected. Rendered via React Flow. Supports pan, zoom, auto-layout, and manual drag.
_Avoid_: Board, Whiteboard

**Auto-layout**
The default behavior where the Canvas automatically positions Blocks according to a tree layout algorithm (dagre). Manual drag overrides the position of individual Blocks without triggering a full re-layout.
_Avoid_: Auto-arrange

---

## Product Decisions

### Block structure
- Every Block has two sections: **LLM Conversation Area** (single Q&A) and **Notes Area** (plain textarea).
- Note Blocks are a separate type for longer-form user content; they use react-md-editor and have no LLM section.
- The **Title** defaults to the user's question and is shown when the Block is collapsed.

### Tree & layout
- The within-file structure is a **Tree** (one parent per Block, no cycles).
- Adding a Block from any of the 8 directional handles of an existing Block always creates a **Child**. Direction only affects the new Block's initial position.
- Dragging a new Block from the sidebar onto empty canvas space creates a **Floating Block**.
- Layout is **auto by default** (dagre via React Flow), **manual drag overrides** individual positions.

### Collapse / expand
- Blocks can be collapsed to show only their Title, or expanded to show full content.
- Default state for a new Block: **expanded**.
- On reopening a File, each Block **restores its last state** (collapsed or expanded).

### LLM interaction
- Each LLM Block supports **one question and one answer only**. No multi-turn chat within a Block.
- For clarification ("I don't understand / give me an example"), the user creates a **Clarification Child** Block.
- Once understanding is reached, the user can trigger a **Merge**: the LLM rewrites the parent's answer incorporating the clarification exchanges, then the Clarification Children are deleted.
- The LLM receives the **Ancestor Chain** as context by default (current block's question → parent → grandparent → root). Future: user can manually select additional Blocks to include.

### File & workspace structure
- Each File has **one Root Block** + optional Floating Blocks.
- Files can be linked to each other, forming an inter-file Tree.
- Inter-file navigation is via the **Graph View** (Obsidian-style).
- Navigating into a File opens its Canvas as a separate full view.

### API Key 安全说明

**当前存储方式**：API Key 通过 Zustand `persist` 中间件以明文 JSON 存入浏览器 **IndexedDB**，key 名为 `"loom-store"`。

**不会出现的风险**：
- Key 不存在任何项目文件中，不会被 git 追踪，不会推到 GitHub。
- `.gitignore` 已预防性屏蔽 `.env` / `.env.*`，防止未来开发时误提交。

**仍然存在的风险**：
- 本机物理访问：有权限操作这台电脑的人可通过 DevTools → Application → IndexedDB 看到明文 Key。
- 同源 XSS：若 app 存在 XSS 漏洞，攻击者可读取 IndexedDB。
- 有权限的浏览器扩展可访问 IndexedDB。

**可选的加固方案**（未实现）：
- Key 只存 `sessionStorage`（关标签页即清除，每次启动手动输入）。
- Key 完全不持久化，只存内存（最安全，刷新即丢失）。
- 对 Key 做对称加密后再存 IndexedDB（增加复杂度，但本质安全性有限）。

**当前决策**：对个人本地学习工具，IndexedDB 明文存储风险可接受。若未来面向多用户或公共设备，需改为 sessionStorage 或不持久化方案。

### LLM providers (priority order)
1. **Anthropic** (Claude)
2. **OpenAI** + custom base URL (covers DeepSeek, Ollama, and any OpenAI-compatible API)
- The user provides their own API Key. No backend proxy.

---

## Technical Architecture

| Concern | Decision |
|---|---|
| Platform | Web app (browser) |
| Persistence | IndexedDB — no backend, no account required |
| Canvas / graph rendering | React Flow (`@xyflow/react`) |
| Auto-layout algorithm | dagre (via `@dagrejs/dagre`) |
| State management | Zustand |
| LLM Block notes | Plain `<textarea>` |
| Note Block editor | `react-md-editor` (lightweight Markdown editor) |
| LLM response rendering | `react-markdown` |
| LLM providers | Anthropic SDK first; OpenAI SDK + custom base URL second |

### Data model (IndexedDB)

```
Workspace
└── File[]
    ├── id: string
    ├── name: string
    ├── rootBlockId: string
    ├── blocks: Block[]
    └── interFileLinks: FileLink[]

Block
├── id: string
├── type: "llm" | "note"
├── title: string (user-defined or defaults to question)
├── question: string (LLM Blocks only)
├── answer: string (LLM Blocks only — rendered as Markdown)
├── notes: string (plain text, LLM Blocks)
├── content: string (Note Blocks — Markdown)
├── parentId: string | null
├── childrenIds: string[]
├── position: { x: number, y: number } (manual override; null = auto-layout)
├── collapsed: boolean
└── createdAt: timestamp
```

### LLM context construction

When the user submits a question in Block B:

1. Walk from B up to the Root, collecting each Block's question + answer.
2. Send as a system/user message sequence: root first, current block last.
3. Append the current Block's question as the final user turn.

Future: user selects additional Blocks (not on the ancestor path) to include.

---

## Feature Roadmap

### MVP (v0.1) — prove the core loop
- [ ] Canvas with React Flow: create Blocks, connect as parent/child, pan/zoom
- [ ] Add child Block from 8 directional handles
- [ ] Drag Block from sidebar to canvas (creates Floating Block)
- [ ] Collapse / expand Blocks (title-only view)
- [ ] Auto-layout (dagre), manual drag override
- [ ] LLM Block: ask a question, render Markdown answer
- [ ] Ancestor Chain context passed to LLM
- [ ] API Key settings (Anthropic + OpenAI/base URL)
- [ ] Persist canvas state to IndexedDB

### v0.2 — notes & merge
- [ ] Notes Area (textarea) inside LLM Blocks
- [ ] Note Block type (react-md-editor)
- [ ] Merge: select parent + clarification children → LLM synthesizes → children removed

### v0.3 — file & workspace
- [ ] Multiple Files in a Workspace
- [ ] Inter-file linking
- [ ] Graph View (Obsidian-style navigation)
- [ ] Floating Blocks within a File

### Future
- [ ] Custom Block selection for LLM context (beyond ancestor chain)
- [ ] Block style customization (shape, color) per user preference
- [ ] Export canvas as Markdown / PDF
- [ ] Cloud sync (optional, on top of local-first)
- [ ] Mobile view
