import { Mastra } from "@mastra/core";
import { chatAgent } from "./agents/chat-agent";

// Mastra インスタンス作成
export const mastra = new Mastra({
  agents: {
    chatAgent,
  },
});

export { chatAgent };
