import { redisClient } from "../config/redis.ts";
import normalizeTime from "../utils/normalizeTime.js";

const tokenUsageRateLimiter = async (req, res, next) => {
  try {
    const key = `token-usage:id:${req.userId}`;
    const tokenUsed = await redisClient.get(key);
    const tokenLimit = Number(process.env.MAX_TOKEN_LIMIT);

    if (Number(tokenUsed || 0) >= tokenLimit) {
      let remainingTime = await redisClient.ttl(key);
      remainingTime = normalizeTime(remainingTime);
      return res.status(429).json({
        message: `Token usage limit exceeded`,
        tokenUsed,
        tokenLimit,
        retryAfter: `${remainingTime}`,
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
