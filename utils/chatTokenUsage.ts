import type { TokensType } from "../service/geminiService.js";
import type { ChatDocument } from "../model/chatSchema.js";

export const addChatTokenUsage: (
  chat: ChatDocument,
  usage: TokensType,
) => Promise<void> = async (chat, usage) => {
  chat.totalTokens += usage.totalTokens ?? 0;
  await chat.save();
};
