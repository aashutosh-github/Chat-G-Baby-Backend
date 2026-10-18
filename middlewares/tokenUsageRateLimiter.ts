import { redisClient } from "../config/redis.js";
import normalizeTime from "../utils/normalizeTime.js";

import type { Request, Response, NextFunction } from "express";

const tokenUsageRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const key = `token-usage:id:${req.userId}`;
    const tokenUsed = await redisClient.get(key);
    const tokenLimit = Number(process.env.MAX_TOKEN_LIMIT);

    if (Number(tokenUsed || 0) >= tokenLimit) {
      let remainingTime: number = await redisClient.ttl(key);
      const remainingTimeNormalized: string = normalizeTime(remainingTime);
      return res.status(429).json({
        message: `Token usage limit exceeded`,
        tokenUsed,
        tokenLimit,
        retryAfter: `${remainingTimeNormalized}`,
      });
    }
    req.tokenUsageKey = key;
    next();
  } catch (err) {
    console.log(`Token usage rate limiter error: ${err}`);
    next();
  }
};

export default tokenUsageRateLimiter;
