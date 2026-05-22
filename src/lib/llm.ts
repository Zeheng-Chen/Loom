import Anthropic from "@anthropic-ai/sdk";
import type { Block, AppSettings } from "./types";
import { buildAncestorChain } from "./context";

export async function askLLM(
  question: string,
  blockId: string,
  blocks: Record<string, Block>,
  settings: AppSettings,
  onChunk: (text: string) => void
): Promise<string> {
  const chain = buildAncestorChain(blockId, blocks);

  const messages: { role: "user" | "assistant"; content: string }[] = [];

  for (const block of chain) {
    if (block.id === blockId) continue;
    if (!block.question || !block.answer) continue;
    messages.push({ role: "user", content: block.question });
    messages.push({ role: "assistant", content: block.answer });
  }

  messages.push({ role: "user", content: question });

  if (settings.provider === "anthropic") {
    const client = new Anthropic({ apiKey: settings.anthropicApiKey, dangerouslyAllowBrowser: true });
    let full = "";
    const stream = client.messages.stream({
      model: settings.model || "claude-opus-4-5",
      max_tokens: 2048,
      messages,
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        full += event.delta.text;
        onChunk(event.delta.text);
      }
    }
    return full;
  }

  throw new Error("Only Anthropic supported in MVP");
}
