import type { JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        name: string;
        age?: number;
        email: string;
      };
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
