import { redisClient } from "../config/redis.ts";
import normalizeTime from "../utils/normalizeTime.js";

const authenticatedUserRateLimiter = async (req, res, next) => {
  try {
    const payload = req.tokenPayload;
    const key = `rate-limit:user-id:${payload.id}`;

    const limit = await redisClient.incr(key);

    if (limit === 1) {
      await redisClient.expire(key, 60);
    }

    if (limit > 20) {
      let remainingTime = await redisClient.ttl(key);
      remainingTime = normalizeTime(remainingTime);
      return res.status(429).json({
        message: `Too many requests, please try after ${remainingTime} seconds`,
      });
    }

    next();
  } catch (err) {
    console.log(`Authenticated rate limiter error:\n ${err}`);
    next();
  }
};

export default authenticatedUserRateLimiter;
