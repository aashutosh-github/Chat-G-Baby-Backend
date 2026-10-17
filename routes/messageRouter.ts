import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as messageController from "../controllers/messageControllers.js";
import authenticatedUserRateLimiter from "../middlewares/authenticatedUserRateLimiter.js";
import loadUserDataIntoReq from "../middlewares/loadUserDataIntoReq.js";
import tokenUsageRateLimiter from "../middlewares/tokenUsageRateLimiter.js";
import type { Router } from "express";

const messageRouter: Router = express.Router();

messageRouter.use(authMiddleware);
messageRouter.use(authenticatedUserRateLimiter);

messageRouter.post(
  "/",
  tokenUsageRateLimiter,
  loadUserDataIntoReq,
  messageController.sendMessage,
);
messageRouter.get(
  "/:chatId",
  loadUserDataIntoReq,
  messageController.getAllMessages,
);
messageRouter.post(
  "/:chatId",
  tokenUsageRateLimiter,
  loadUserDataIntoReq,
  messageController.sendMessage,
);
messageRouter.delete(
  "/:chatId/:msgId",
  loadUserDataIntoReq,
  messageController.deleteMessage,
);

export default messageRouter;
