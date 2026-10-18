import { UserDocument } from "../model/userSchema.js";

export const addUserTokenUsage: (
  user: UserDocument,
  token: number,
) => Promise<void> = async (user, token) => {
  user.totalTokenUsed += token;
  await user.save();
};
