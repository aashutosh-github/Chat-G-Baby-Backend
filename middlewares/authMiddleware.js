import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.ts";

const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

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
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Please login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token was tampered." });
    }
    return res.status(500).json({ message: "Failed to authenticate token" });
  }
};

export default authMiddleware;
