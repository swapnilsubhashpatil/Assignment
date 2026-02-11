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
          reasoning: z.string().describe("Brief explanation of why this agent was chosen"),
        }),
        messages: [{ role: "system", content: ROUTER_PROMPT }, ...messages],
      });

      // Validate the response has all required fields
      if (!object.reasoning || !object.agent) {
        throw new Error("Missing required fields in response");
      }

      return object;
    } catch (error) {
      console.error("Router agent error:", error);
      return { agent: "support", reasoning: "Fallback due to router error" };
    }
  },
};
