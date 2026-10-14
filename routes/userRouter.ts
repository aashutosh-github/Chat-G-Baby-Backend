import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as userController from "../controllers/userControllers.js";
import unauthenticatedRateLimiter from "../middlewares/unauthenticatedUserRateLimiter.js";
import loadUserDataIntoReq from "../middlewares/loadUserDataIntoReq.js";
import authenticatedRateLimiter from "../middlewares/authenticatedUserRateLimiter.js";

const userRouter = express.Router();

userRouter.post("/signup", unauthenticatedRateLimiter, userController.signUp);
userRouter.post("/login", unauthenticatedRateLimiter, userController.logIn);
userRouter.get(
  "/profile",
  authMiddleware,
  authenticatedRateLimiter,
  loadUserDataIntoReq,
  userController.profile,
);
userRouter.post(
  "/logout",
  authMiddleware,
  authenticatedRateLimiter,
  loadUserDataIntoReq,
  userController.logOut,
);
userRouter.delete(
  "/delete",
  authMiddleware,
  authenticatedRateLimiter,
  loadUserDataIntoReq,
  userController.deleteProfile,
);

export default userRouter;
