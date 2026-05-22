import { create } from "zustand";
import type { Block, LoomFile, AppSettings } from "../lib/types";
import { nanoid } from "nanoid";

interface AppState {
  file: LoomFile;
  settings: AppSettings;
  selectedBlockId: string | null;

  addBlock: (parentId: string | null, position?: { x: number; y: number }) => string;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string, recursive?: boolean) => void;
  setSelectedBlock: (id: string | null) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
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

export const useStore = create<AppState>((set, get) => ({
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

  setSelectedBlock: (id) => set({ selectedBlockId: id }),

  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
}));
