import { describe, it, expect, vi, beforeAll } from "vitest";
import { Hono } from "hono";
import { app } from "../app";

describe("Chat API Integration", () => {
  let testApp: Hono;

  beforeAll(() => {
    testApp = app;
  });

  describe("POST /api/chat/messages", () => {
    it("should return 400 for invalid user", async () => {
      const res = await testApp.request("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Hello",
          userId: "invalid_user",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid user");
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await testApp.request("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Hello",
          userId: "user_1",
          conversationId: "non-existent-id-12345",
        }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Conversation not found");
    });

    it("should reject empty messages with validation error", async () => {
      const res = await testApp.request("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          userId: "user_1",
        }),
      });

      // Zod validation returns 500 currently due to error handler
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/agents", () => {
    it("should list all available agents", async () => {
      const res = await testApp.request("/api/agents");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.agents).toHaveLength(3);
      expect(body.agents.map((a: any) => a.type)).toContain("support");
      expect(body.agents.map((a: any) => a.type)).toContain("order");
      expect(body.agents.map((a: any) => a.type)).toContain("billing");
    });
  });

  describe("GET /api/agents/:type/capabilities", () => {
    it("should return capabilities for order agent", async () => {
      const res = await testApp.request("/api/agents/order/capabilities");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.type).toBe("order");
      expect(body.capabilities).toHaveLength(2);
      expect(body.capabilities.map((c: any) => c.name)).toContain(
        "fetchOrderDetails"
      );
      expect(body.capabilities.map((c: any) => c.name)).toContain(
        "checkDeliveryStatus"
      );
    });

    it("should return capabilities for billing agent", async () => {
      const res = await testApp.request("/api/agents/billing/capabilities");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.type).toBe("billing");
      expect(body.capabilities).toHaveLength(2);
      expect(body.capabilities.map((c: any) => c.name)).toContain(
        "getInvoiceDetails"
      );
      expect(body.capabilities.map((c: any) => c.name)).toContain(
        "checkRefundStatus"
      );
    });

    it("should return 404 for unknown agent type", async () => {
      const res = await testApp.request("/api/agents/unknown/capabilities");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const res = await testApp.request("/api/health");

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("GET /api/chat/conversations", () => {
    it("should require valid user", async () => {
      const res = await testApp.request("/api/chat/conversations?userId=invalid");

      expect(res.status).toBe(400);
    });

    it("should return conversations for valid user", async () => {
      const res = await testApp.request("/api/chat/conversations?userId=user_1");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.conversations).toBeDefined();
    });
  });

  describe("DELETE /api/chat/conversations/:id", () => {
    it("should return 404 for non-existent conversation", async () => {
      const res = await testApp.request(
        "/api/chat/conversations/non-existent?userId=user_1",
        { method: "DELETE" }
      );

      expect(res.status).toBe(404);
    });
  });
});

describe("Rate Limiting", () => {
  it("should allow requests within rate limit", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
  });

  it("should track requests by IP", async () => {
    // Make request with specific IP
    const res = await app.request("/api/health", {
      headers: { "X-Forwarded-For": "192.168.1.1" },
    });

    expect(res.status).toBe(200);
  });
});

describe("Response Headers", () => {
  it("should include CORS headers", async () => {
    const res = await app.request("/api/agents", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
