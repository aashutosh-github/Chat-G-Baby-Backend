import { redisClient } from "../config/redis.js";
import normalizeTime from "../utils/normalizeTime.js";
import type { Request, Response, NextFunction } from "express";

const authenticatedUserRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.tokenPayload;
    if (!payload) {
      return res.status(401).json({
        message: `User token payload not found, please login again`,
      });
    }
    const key: string = `rate-limit:user-id:${payload.id}`;

    const limit: number = await redisClient.incr(key);

    if (limit === 1) {
      await redisClient.expire(key, 60);
    }

    if (limit > 20) {
      const remainingTimeInSeconds = await redisClient.ttl(key);
      const formattedTime = normalizeTime(remainingTimeInSeconds);
      return res.status(429).json({
        message: `Too many requests, please try after ${formattedTime} seconds`,
      });
    }

    next();
  } catch (err) {
    console.log(`Authenticated rate limiter error:\n ${err}`);
    next();
  }
};

export default authenticatedUserRateLimiter;
