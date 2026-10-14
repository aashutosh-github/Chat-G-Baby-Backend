import type { JwtPayload } from "jsonwebtoken";
import type { HydratedDocument } from "mongoose";
import type User from "../model/userSchema.js";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<typeof User>;
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
