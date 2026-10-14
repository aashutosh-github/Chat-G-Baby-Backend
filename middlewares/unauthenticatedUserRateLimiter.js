// I will only allow 10 requests/min on unauthorized user requests

import { redisClient } from "../config/redis.ts";
import normalizeTime from "../utils/normalizeTime.js";

const unauthenticatedRateLimiter = async (req, res, next) => {
  try {
    const key = `rate-limit:ip:${req.ip}`;
    const requestCount = await redisClient.incr(key);

    if (requestCount === 1) {
      redisClient.expire(key, 60);
    }

    if (requestCount > 10) {
      let remainingTime = await redisClient.ttl(key);
      remainingTime = normalizeTime(remainingTime);
      return res
        .status(429)
        .json({ message: `please try after ${remainingTime} seconds` });
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
