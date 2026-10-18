import mongoose from "mongoose";

import type { HydratedDocument, InferSchemaType } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    role: {
      type: String,
      enum: ["user_input", "model_output"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    tokens: {
      type: Number,
      default: 0,
    },

    totalTokens: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

export type MessageSchemaType = InferSchemaType<typeof messageSchema>;
export type MessageDocument = HydratedDocument<MessageSchemaType>;

const Message = mongoose.model<MessageSchemaType>("Message", messageSchema);

export default Message;
