import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", err => {
  console.error(err);
  throw new Error("Could not connect to redis");
});

const connectRedis: () => Promise<void> = async () => {
  await redisClient.connect();
  console.log(`Redis connected successfully`);
};

export { redisClient, connectRedis };
