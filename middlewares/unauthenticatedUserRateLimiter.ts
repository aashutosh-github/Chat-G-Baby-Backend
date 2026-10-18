// I will only allow 10 requests/min on unauthorized user requests

import { redisClient } from "../config/redis.js";
import normalizeTime from "../utils/normalizeTime.js";

import type { Request, Response, NextFunction } from "express";

const unauthenticatedRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const key = `rate-limit:ip:${req.ip}`;
    const requestCount: number = await redisClient.incr(key);

    if (requestCount === 1) {
      redisClient.expire(key, 60);
    }

    if (requestCount > 10) {
      let remainingTime: number = await redisClient.ttl(key);
      const remainingTimeNormalized: string = normalizeTime(remainingTime);
      return res.status(429).json({
        message: `please try after ${remainingTimeNormalized} seconds`,
      });
    }

    next();
  } catch (err) {
    console.error(err);
    // error will be occurring if there is an error with redis checking the rate limit, if there
    // is any such error, I will consider it my mistake in not being able to manage my server properly
    // and allow the user to pass through, also this is not a very resource heavy route, so i can
    // afford to do this here;
    next();
  }
};

export default unauthenticatedRateLimiter;
