import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

export const google = createGoogleGenerativeAI({
  apiKey,
});
