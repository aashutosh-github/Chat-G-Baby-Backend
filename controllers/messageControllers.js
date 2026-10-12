import mongoose from "mongoose";
import Chat from "../model/chatSchema.js";
import Message from "../model/messageSchema.js";
import { addUserTokenUsage } from "../utils/userUsage.js";
import { addChatTokenUsage } from "../utils/chatTokenUsage.js";
import { buildContextForAi } from "../utils/buildContext.js";
import { generateAiResponse } from "../service/geminiService.js";
import { updateSummaryIfNeeded } from "../service/summaryService.js";
import { redisClient } from "../config/redis.js";

export const getAllMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: "No such chat found" });
    }

    const returnedMessages = await Message.find({
      userId: req.user._id,
      chatId: chatId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({ messages: returnedMessages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Data not provided" });
    }

    if (content.length >= 1500) {
      return res.status(400).json({
        message: `Content size too big`,
      });
    }

    let chat;
    let isFirstMessage = false;

    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: "Incorrect format of chat id" });
      }
      chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
    } else {
      chat = await Chat.create({ userId: req.user._id });
    }

    const messagesToBeSent = await Message.find({ chatId })
      .sort({ updatedAt: 1 })
      .skip(chat.summarizedTillMessageNumber);

    const messages = buildContextForAi(chat, messagesToBeSent, content.trim());

    const userInfo = {
      name: req.user.name,
      age: req.user.age,
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
      return res.status(429).json({
        message: `Another one of your requests is being processed. Kindly wait for it to be completed before trying again.`,
      });
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
      userId: req.user._id,
      chatId: chat._id,
      role: "user_input",
      content: content.trim(),
    });

    await Message.create({
      userId: req.user._id,
      chatId: chat._id,
      role: "model_output",
      content: aiReply.modelReply,
      totalTokens: parseInt(aiReply.usage.totalTokens),
    });

    chat.messageCount += 2;

    // save usage data to redis
    const tokenUsed = await redisClient.incrBy(
      req.tokenUsageKey,
      Number(aiReply.usage.totalTokens),
    );

    if (tokenUsed === aiReply.usage.totalTokens) {
      // this means that this was the first time the usage limit is being set in redis
      await redisClient.expire(
        req.tokenUsageKey,
        Number(process.env.REDIS_TOKEN_LIMIT_HOURS) * 60 * 60,
      );
    }

    await addChatTokenUsage(chat, aiReply.usage);
    await addUserTokenUsage(req.user, aiReply.usage.totalTokens);
    await chat.save();

    await updateSummaryIfNeeded(chat._id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
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
    const message = await Message.findOne({
      _id: msgId,
      userId: req.user._id,
      chatId,
    });
    if (!message) {
      return res.status(403).json({ message: `Invalid credentials` });
    }
    await Message.deleteOne({ _id: message._id });
    return res.status(200).json({ message: `Message deleted successfully` });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: `Internal server error` });
  }
};
