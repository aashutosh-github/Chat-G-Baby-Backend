import type { JwtPayload } from "jsonwebtoken";
import type { UserDocument } from "../model/userSchema.ts";
import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      userId?: string;
      token?: string;
      tokenPayload?: JwtPayload & {
        id: string;
        email: string;
      };
      tokenUsageKey?: string;
    }
  }
}

export {};
