import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { Block, LoomFile, AppSettings } from "../lib/types";
import { nanoid } from "nanoid";
import { parseMarkdownTree, type Section } from "../lib/expand";

const idbStorage = createJSONStorage(() => ({
  getItem: (name: string) => idbGet(name).then((v) => v ?? null),
  setItem: (name: string, value: string) => idbSet(name, value),
  removeItem: (name: string) => idbDel(name),
}));

interface AppState {
  file: LoomFile;
  settings: AppSettings;
  selectedBlockId: string | null;
  toast: string | null;

  addBlock: (parentId: string | null, position?: { x: number; y: number }) => string;
  addTestBlock: () => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string, recursive?: boolean) => void;
  expandBlock: (id: string) => void;
  setSelectedBlock: (id: string | null) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setToast: (msg: string | null) => void;
}

function createRootBlock(): Block {
  const id = nanoid();
  return {
    id,
    type: "llm",
    title: "Root",
    question: "",
    answer: "",
    notes: "",
    content: "",
    parentId: null,
    childrenIds: [],
    position: { x: 400, y: 100 },
    collapsed: false,
    createdAt: Date.now(),
  };
}

const rootBlock = createRootBlock();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  file: {
    id: nanoid(),
    name: "Untitled",
    rootBlockId: rootBlock.id,
    blocks: { [rootBlock.id]: rootBlock },
  },
  settings: {
    anthropicApiKey: "",
    openaiApiKey: "",
    openaiBaseUrl: "",
    provider: "anthropic",
    model: "claude-opus-4-5",
  },
  selectedBlockId: null,
  toast: null,

  addBlock: (parentId, position) => {
    const id = nanoid();
    const parent = parentId ? get().file.blocks[parentId] : null;
    const newBlock: Block = {
      id,
      type: "llm",
      title: "",
      question: "",
      answer: "",
      notes: "",
      content: "",
      parentId,
      childrenIds: [],
      position: position ?? (parent?.position
        ? { x: parent.position.x + 300, y: parent.position.y }
        : { x: 400, y: 300 }),
      collapsed: false,
      createdAt: Date.now(),
    };
    set((state) => {
      const blocks = { ...state.file.blocks, [id]: newBlock };
      if (parentId && blocks[parentId]) {
        blocks[parentId] = {
          ...blocks[parentId],
          childrenIds: [...blocks[parentId].childrenIds, id],
        };
      }
      return { file: { ...state.file, blocks } };
    });
    return id;
  },

  addTestBlock: () => {
    const id = nanoid();
    const TEST_ANSWER = `# 神经网络基础\n\n神经网络由相互连接的节点构成。\n\n## 前向传播\n\n数据从输入层到输出层的计算过程。\n\n### 激活函数\n\n引入非线性，使网络能拟合复杂函数。\n\n### 权重矩阵\n\n每层的连接强度由权重矩阵决定。\n\n## 反向传播\n\n根据损失函数对权重求梯度并更新。\n\n### 梯度下降\n\n沿梯度反方向迭代更新参数。\n\n# 常见架构\n\n## CNN\n\n卷积神经网络，擅长图像处理。\n\n## Transformer\n\n基于注意力机制，主导 NLP 领域。`;
    set((state) => {
      const block: Block = {
        id,
        type: "llm",
        title: "测试展开块",
        question: "神经网络的基础知识是什么？",
        answer: TEST_ANSWER,
        notes: "",
        content: "",
        parentId: null,
        childrenIds: [],
        position: { x: 200, y: 200 },
        collapsed: false,
        createdAt: Date.now(),
      };
      return { file: { ...state.file, blocks: { ...state.file.blocks, [id]: block } } };
    });
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      file: {
        ...state.file,
        blocks: {
          ...state.file.blocks,
          [id]: { ...state.file.blocks[id], ...updates },
        },
      },
    }));
  },

  deleteBlock: (id, recursive = false) => {
    set((state) => {
      const blocks = { ...state.file.blocks };
      const block = blocks[id];
      if (!block) return state;

      const toDelete = new Set<string>();
      const collect = (blockId: string) => {
        toDelete.add(blockId);
        blocks[blockId]?.childrenIds.forEach(collect);
      };
      if (recursive) {
        collect(id);
      } else {
        toDelete.add(id);
      }

      if (block.parentId && blocks[block.parentId] && !toDelete.has(block.parentId)) {
        blocks[block.parentId] = {
          ...blocks[block.parentId],
          childrenIds: blocks[block.parentId].childrenIds.filter((c) => !toDelete.has(c)),
        };
      }

      toDelete.forEach((bid) => delete blocks[bid]);
      return { file: { ...state.file, blocks } };
    });
  },

  expandBlock: (id) => {
    const block = get().file.blocks[id];
    if (!block?.answer) return;
    const roots = parseMarkdownTree(block.answer);
    if (roots.length === 0) {
      get().setToast("回答中没有找到 Markdown 标题，无法展开");
      return;
    }
    const baseX = (block.position?.x ?? 400) + 420;
    const baseY = block.position?.y ?? 100;
    const minLevel = roots[0].level;
    set((state) => {
      const blocks = { ...state.file.blocks };
      let counter = 0;

      const createBlocks = (sections: Section[], parentId: string): string[] =>
        sections.map((section) => {
          const childId = nanoid();
          const idx = counter++;
          const depth = section.level - minLevel;
          blocks[childId] = {
            id: childId,
            type: "note",
            title: section.title,
            question: "",
            answer: "",
            notes: "",
            content: section.content,
            parentId,
            childrenIds: [],
            position: { x: baseX + depth * 420, y: baseY + idx * 200 },
            collapsed: false,
            createdAt: Date.now(),
          };
          const grandChildIds = createBlocks(section.children, childId);
          blocks[childId] = { ...blocks[childId], childrenIds: grandChildIds };
          return childId;
        });

      const newChildIds = createBlocks(roots, id);
      blocks[id] = { ...blocks[id], childrenIds: [...blocks[id].childrenIds, ...newChildIds] };
      return { file: { ...state.file, blocks } };
    });
  },

  setSelectedBlock: (id) => set({ selectedBlockId: id }),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      setToast: (msg) => set({ toast: msg }),
    }),
    {
      name: "loom-store",
      storage: idbStorage,
      partialize: (state) => ({ file: state.file, settings: state.settings }),
    }
  )
);
