import jwt from "jsonwebtoken";

import { redisClient } from "../config/redis.js";

import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

type AuthPayload = JwtPayload & {
  id: string;
  email: string;
};

const isAuthPayload = (
  payload: string | JwtPayload,
): payload is AuthPayload => {
  return (
    typeof payload !== "string" &&
    typeof payload.id === "string" &&
    typeof payload.email === "string"
  );
};

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(`JWT_SECRET is not configured`);
    }

    const payload = jwt.verify(token, jwtSecret);

    if (!isAuthPayload(payload)) {
      return res.status(401).json({
        message: `Invalid token payload`,
      });
    }

    // checking for blocked token after verifying existing token because we do not want to
    // hit redis for every request, some will be rejected by verify step already
    const blockedToken = await redisClient.get(`token-blocked:${token}`);
    if (blockedToken) {
      return res.status(401).json({ message: `Please login again` });
    }

    req.userId = payload.id;
    req.token = token;
    req.tokenPayload = payload;

    next();
  } catch (err) {
    console.error(err);

    if (err instanceof Error && err.name === "TokenExpiredError") {
      return res.status(401).json({ message: `Please login again` });
    }

    if (err instanceof Error && err.name === "JsonWebTokenError") {
      return res.status(403).json({
        message: `Token was tampered with`,
      });
    }

    return res.status(500).json({ message: `Failed to authenticate token` });
  }
};

export default authMiddleware;
