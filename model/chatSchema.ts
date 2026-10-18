import mongoose from "mongoose";

import type { HydratedDocument, InferSchemaType } from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: String,
      default: "New Chat",
    },

    summary: {
      type: String,
      default: "",
    },

    summaryUpdatedAt: {
      type: Date,
      default: null,
    },

    summarizedTillMessageNumber: {
      type: Number,
      default: 0,
    },

    messageCount: {
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

chatSchema.index({ userId: 1, updatedAt: -1 });

export type ChatSchemaType = InferSchemaType<typeof chatSchema>;
export type ChatDocument = HydratedDocument<ChatSchemaType>;

const Chat = mongoose.model<ChatSchemaType>("Chat", chatSchema);

export default Chat;
