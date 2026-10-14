import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Gemini api key not provided");
}

const gemini = new GoogleGenAI({});

export default gemini;
