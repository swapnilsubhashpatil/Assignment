import { generateObject } from "ai";
import { z } from "zod";
import { google, GEMINI_MODEL } from "../lib/ai.js";
import { ROUTER_PROMPT } from "./prompts/index.js";

export const routerAgent = {
  classify: async (messages: any[]) => {
    try {

      const { object } = await generateObject({
        model: google(GEMINI_MODEL),
        schema: z.object({
          agent: z.enum(["support", "order", "billing"]),
          reasoning: z.string(),
        }),
        messages: [{ role: "system", content: ROUTER_PROMPT }, ...messages],
      });

      return object;
    } catch {
      return { agent: "support", reasoning: "Fallback due to router error" };
    }
  },
};
