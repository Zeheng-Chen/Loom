export type BlockType = "llm" | "note";

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  question: string;
  answer: string;
  notes: string;
  content: string;
  parentId: string | null;
  childrenIds: string[];
  position: { x: number; y: number } | null;
  collapsed: boolean;
  createdAt: number;
}

export interface LoomFile {
  id: string;
  name: string;
  rootBlockId: string;
  blocks: Record<string, Block>;
}

export interface AppSettings {
  anthropicApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  provider: "anthropic" | "openai";
  model: string;
}
