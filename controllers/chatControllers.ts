import type { Request, Response } from "express";
import mongoose from "mongoose";
import Chat from "../model/chatSchema.js";
import Message from "../model/messageSchema.js";

type ChatParams = {
  chatId: string;
};

export const getRecentChats = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: `User not authenticated`,
      });
    }
    const chats = await Chat.find({ userId: req.user._id })
      .select("topic updatedAt")
      .sort({ updatedAt: -1 })
      .limit(20);

    return res.status(200).json({
      message: "Your 20 recent chats",
      chats,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createChat = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: `User not authenticated` });
    }
    const createdChat = await Chat.create({ userId: req.user._id });
    return res.status(201).json({
      message: "Chat created successfully",
      chat: {
        userId: createdChat.userId,
        chatId: createdChat._id,
        createdAt: createdChat.createdAt,
        topic: createdChat.topic,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChat = async (
  req: Request<ChatParams>,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user?._id });
    if (!chat) {
      return res.status(403).json({ message: "Invalid credentials" });
    }

    await Message.deleteMany({ chatId: chat._id });
    await Chat.deleteOne({ _id: chat._id });

    return res.status(200).json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getSingleChat = async (
  req: Request<ChatParams>,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        message: `User is not authenticated`,
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user._id,
    });
    if (!chat) {
      return res.status(404).json({ message: "No such chat found" });
    }

    return res.status(200).json({
      userId: chat.userId,
      chatId: chat._id,
      topic: chat.topic,
      usage: chat.totalTokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
