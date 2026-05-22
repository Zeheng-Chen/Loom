import type { Block } from "./types";

export function buildAncestorChain(
  blockId: string,
  blocks: Record<string, Block>
): Block[] {
  const chain: Block[] = [];
  let current: Block | null = blocks[blockId] ?? null;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? (blocks[current.parentId] ?? null) : null;
  }
  return chain;
}
