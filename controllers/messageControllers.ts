import mongoose, { ObjectId } from "mongoose";
import Chat from "../model/chatSchema.js";
import Message from "../model/messageSchema.js";
import { addUserTokenUsage } from "../utils/userUsage.js";
import { addChatTokenUsage } from "../utils/chatTokenUsage.js";
import { buildContextForAi } from "../utils/buildContext.js";
import { generateAiResponse } from "../service/geminiService.js";
import { updateSummaryIfNeeded } from "../service/summaryService.js";
import { redisClient } from "../config/redis.js";
import type { Application, Request, Response } from "express";
import type { AiContext } from "../utils/buildContext.js";

type MessageParam = {
  chatId: string;
  msgId?: string;
};

export const getAllMessages = async (
  req: Request<MessageParam>,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: `invalid chat ID` });
    }
    if (!req.user) {
      return res.status(401).json({ message: `User is not authenticated` });
    }
    const user = req.user;
    const chat = await Chat.findOne({ _id: chatId, userId: user._id });
    if (!chat) {
      return res.status(404).json({ message: "No such chat found" });
    }

    const returnedMessages = await Message.find({
      userId: user._id,
      chatId: chatId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({ messages: returnedMessages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (
  req: Request<MessageParam>,
  res: Response,
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!req.user) {
      res.status(401).json({ message: `User is not authenticated` });
      return;
    }

    const user = req.user;

    if (!req.tokenUsageKey) {
      res.status(500).json({ message: `Token usage key not available` });
      return;
    }

    const tokenUsageKey: string = req.tokenUsageKey;

    if (!content || content.trim() === "") {
      res.status(400).json({ message: "Data not provided" });
      return;
    }

    if (content.length >= 1500) {
      res.status(400).json({
        message: `Content size too big`,
      });
      return;
    }

    let chat;
    let isFirstMessage: boolean = false;

    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        res.status(400).json({ message: "Incorrect format of chat id" });
        return;
      }
      chat = await Chat.findOne({ _id: chatId, userId: user._id });
      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }
    } else {
      chat = await Chat.create({ userId: user._id });
    }

    const messagesToBeSent = await Message.find({ chatId })
      .sort({ updatedAt: 1 })
      .skip(chat.summarizedTillMessageNumber);

    const messages: AiContext = buildContextForAi(
      chat,
      messagesToBeSent,
      content.trim(),
    );

    const userInfo = {
      name: user.name,
      age: user.age,
    };

    const chatLock = await redisClient.set(
      `chat-lock:id:${req.userId}`,
      "locked",
      {
        condition: "NX",
        expiration: {
          type: "EX",
          value: 60,
        },
      },
    );
    if (chatLock === null) {
      res.status(429).json({
        message: `Another one of your requests is being processed. Kindly wait for it to be completed before trying again.`,
      });
      return;
    }
    const aiReply = await generateAiResponse(messages, userInfo);
    await redisClient.del(`chat-lock:id:${req.userId}`);

    isFirstMessage = chat.messageCount === 0;
    if (isFirstMessage) {
      const topic = content.trim().slice(0, 40);
      chat.topic = topic;
    }

    res.status(200).json({
      user_input: content.trim(),
      output: aiReply.modelReply,
      chatId: chat._id,
      usage: {
        tokenUsed: aiReply.usage.totalTokens,
        tokenLimit: process.env.MAX_TOKEN_LIMIT,
      },
    });

    await Message.create({
      userId: user._id,
      chatId: chat._id,
      role: "user_input",
      content: content.trim(),
    });

    await Message.create({
      userId: user._id,
      chatId: chat._id,
      role: "model_output",
      content: aiReply.modelReply,
      totalTokens: parseInt(aiReply.usage.totalTokens),
    });

    chat.messageCount += 2;

    // save usage data to redis
    const tokenUsed = await redisClient.incrBy(
      tokenUsageKey,
      Number(aiReply.usage.totalTokens),
    );

    if (tokenUsed === aiReply.usage.totalTokens) {
      // this means that this was the first time the usage limit is being set in redis
      await redisClient.expire(
        tokenUsageKey,
        Number(process.env.REDIS_TOKEN_LIMIT_HOURS) * 60 * 60,
      );
    }

    await addChatTokenUsage(chat, aiReply.usage);
    await addUserTokenUsage(user, aiReply.usage.totalTokens);
    await chat.save();

    await updateSummaryIfNeeded(chat._id);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const deleteMessage = async (
  req: Request<MessageParam>,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId, msgId } = req.params;
    if (
      !chatId ||
      !msgId ||
      !mongoose.Types.ObjectId.isValid(chatId) ||
      !mongoose.Types.ObjectId.isValid(msgId)
    ) {
      return res.status(400).json({ message: `Invalid chat or message id` });
    }

    if (!req.user) {
      return res.status(401).json({ message: `User is not authenticated` });
    }

    const user = req.user;

    const message = await Message.findOne({
      _id: msgId,
      userId: user._id,
      chatId,
    });
    if (!message) {
      return res.status(403).json({ message: `Invalid credentials` });
    }
    await Message.deleteOne({ _id: message._id });
    return res.status(200).json({ message: `Message deleted successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error` });
  }
};
