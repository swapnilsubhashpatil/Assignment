import { createGoogleGenerativeAI } from "@ai-sdk/google";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google AI
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Use Gemini 2.0 Flash for fast responses
export const GEMINI_MODEL = "gemini-2.0-flash";

// Validate API key on startup
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn("Warning: GOOGLE_GENERATIVE_AI_API_KEY not set");
}
