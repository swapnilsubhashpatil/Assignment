import { describe, it, expect, vi } from "vitest";
import { routerAgent } from "../agents/router.agent";
import * as aiModule from "ai";

// Mock the AI SDK
vi.mock("ai", async () => {
  const actual = await vi.importActual("ai");
  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

describe("Router Agent", () => {
  it("should classify order-related queries", async () => {
    vi.mocked(aiModule.generateObject).mockResolvedValue({
      object: {
        agent: "order",
        reasoning: "User is asking about order status and delivery",
      },
    });

    const result = await routerAgent.classify([
      { role: "user", content: "Where is my order ORD-1001?" },
    ]);

    expect(result.agent).toBe("order");
    expect(result.reasoning).toContain("order");
  });

  it("should classify billing-related queries", async () => {
    vi.mocked(aiModule.generateObject).mockResolvedValue({
      object: {
        agent: "billing",
        reasoning: "User is asking about refund status",
      },
    });

    const result = await routerAgent.classify([
      { role: "user", content: "I need a refund for my Bluetooth Speaker" },
    ]);

    expect(result.agent).toBe("billing");
    expect(result.reasoning).toContain("refund");
  });

  it("should classify support queries as default", async () => {
    vi.mocked(aiModule.generateObject).mockResolvedValue({
      object: {
        agent: "support",
        reasoning: "General inquiry about password reset",
      },
    });

    const result = await routerAgent.classify([
      { role: "user", content: "How do I reset my password?" },
    ]);

    expect(result.agent).toBe("support");
  });

  it("should fallback to support on error", async () => {
    vi.mocked(aiModule.generateObject).mockRejectedValue(
      new Error("API Error")
    );

    const result = await routerAgent.classify([
      { role: "user", content: "Hello" },
    ]);

    expect(result.agent).toBe("support");
    expect(result.reasoning).toContain("Fallback");
  });

  it("should consider conversation context for routing", async () => {
    // When user mentions "refund" after discussing an order
    vi.mocked(aiModule.generateObject).mockResolvedValue({
      object: {
        agent: "billing",
        reasoning: "User previously discussed order and now asks for refund",
      },
    });

    const result = await routerAgent.classify([
      { role: "user", content: "Where is my order ORD-1001?" },
      { role: "assistant", content: "Your order is shipped." },
      { role: "user", content: "Can I get a refund for that?" },
    ]);

    expect(result.agent).toBe("billing");
  });
});
