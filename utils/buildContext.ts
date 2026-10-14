type TextContent = {
  type: "text";
  text: string;
};

type UserInput = {
  type: "user_input";
  content: TextContent[];
};

type ModelOutput = {
  type: "model_output";
  content: TextContent[];
};

type SummarizeChats = {
  role: "user_input" | "model_output";
  content: string;
};

type ChatType = {
  summary?: string | null;
};

export const buildContextForAi = (
  chat: ChatType,
  chatsToBeSummarized: SummarizeChats[],
  currentMessage: string,
) => {
  let messages: AiContext = [];
  if (chat.summary && chat.summary.trim() !== "") {
    messages.push({
      type: "user_input",
      content: [{ type: "text", text: `Summary: ${chat.summary}` }],
    });
  }

  for (const msg of chatsToBeSummarized) {
    messages.push({
      type: msg.role,
      content: [{ type: "text", text: msg.content }],
    });
  }

  messages.push({
    type: "user_input",
    content: [{ type: "text", text: currentMessage.trim() }],
  });

  return messages;
};

export type AiContext = Array<UserInput | ModelOutput>;
