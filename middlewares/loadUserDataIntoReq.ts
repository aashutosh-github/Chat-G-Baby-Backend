import User from "../model/userSchema.js";

import type { Request, Response, NextFunction } from "express";

const loadUserDataIntoReq = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.tokenPayload;

    if (!payload) {
      return res.status(401).json({ message: `User is not authenticated` });
    }

    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: `User does not exist` });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      age: user.age ?? undefined,
      email: user.email,
      totalTokenUsed: user.totalTokenUsed,
    };

    next();
  } catch (err) {
    console.error(err);
  }
};

export default loadUserDataIntoReq;
