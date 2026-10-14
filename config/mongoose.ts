import mongoose from "mongoose";

const connectDB: () => Promise<void> = async () => {
  await mongoose.connect(process.env.MONGO_URL!);
  console.log(`Connected to MongoDb`);
};

export default connectDB;
