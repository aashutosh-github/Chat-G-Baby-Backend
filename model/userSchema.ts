import mongoose from "mongoose";

import type { HydratedDocument, InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    totalTokenUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export type UserSchemaType = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserSchemaType>;

const User = mongoose.model<UserSchemaType>("User", userSchema);

export default User;
