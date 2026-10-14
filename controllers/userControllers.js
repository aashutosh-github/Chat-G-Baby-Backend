import User from "../model/userSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { signupSchema, loginSchema } from "../validators/userValidators.js";
import Chat from "../model/chatSchema.js";
import Message from "../model/messageSchema.js";
import { redisClient } from "../config/redis.ts";

const cookiesConfig = {
  httpOnly: true,
  secure: false,
  maxAge: 1000 * 60 * 60,
};

const createToken = (id, email) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Environment variable not found");
  }
  const token = jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

export const signUp = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const { name, age, email, password } = result.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ message: "These credentials are already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const createdUser = await User.create({
      name,
      age,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "created user successfully",
      user: {
        name: createdUser.name,
        email: createdUser.email,
        age: createdUser.age,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logIn = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: "Credentials not provided" });
    }

    const user = await User.findOne({ email: result.data.email });
    if (!user) {
      return res.status(401).json({ message: `Invalid credentials` });
    }

    const isPasswordCorrect = await bcrypt.compare(
      result.data.password,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    const token = createToken(user._id, user.email);
    res.cookie("token", token, cookiesConfig);

    return res.status(200).json({
      message: "User logged in successfully",
      data: {
        name: user.name,
        age: user.age,
        email: user.email,
        usage: user.usage,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logOut = async (req, res) => {
  try {
    const token = req.token;
    const payload = req.tokenPayload;
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - currentTime;

    if (remainingTime > 0) {
      const result = await redisClient.set(
        `token-blocked:${token}`,
        "blocked",
        {
          ex: remainingTime,
        },
      );
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
    });
    return res.status(200).json("User logged out successfully");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const profile = async (req, res) => {
  try {
    return res.status(200).json({
      name: req.user.name,
      age: req.user.age,
      email: req.user.email,
      usage: {
        tokenUsed: req.user.totalTokenUsed,
        tokenLimit: process.env.MAX_TOKEN_LIMIT,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;

    await Message.deleteMany({ userId });
    await Chat.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    const token = req.token;
    const payload = req.tokenPayload;
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - currentTime;
    if (remainingTime > 0) {
      await redisClient.set(`token-blocked:${token}`, "blocked", {
        ex: remainingTime,
      });
    }
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
    });

    return res
      .status(200)
      .json({ message: "user profile deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
