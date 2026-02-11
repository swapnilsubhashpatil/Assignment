import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock must be before imports
vi.mock("../db/client.js", () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

import {
  createFetchOrderDetailsTool,
  createCheckRefundStatusTool,
  createGetInvoiceDetailsTool,
} from "../agents/tools";
import { prisma } from "../db/client.js";

const mockPrisma = prisma as any;

describe("Agent Tools - Data Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchOrderDetails Tool", () => {
    it("should only fetch orders for the specific user", async () => {
      const userId = "user_123";
      const tool = createFetchOrderDetailsTool(userId);

      mockPrisma.order.findMany.mockResolvedValue([
        { orderNumber: "ORD-001", status: "delivered", user: { name: "Alice" } },
      ]);

      await tool.execute({ orderNumber: undefined });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user: { userId },
          },
        })
      );
    });

    it("should return error when accessing other user's order", async () => {
      const userId = "user_123";
      const tool = createFetchOrderDetailsTool(userId);

      // Simulate order not found (belongs to different user)
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const result = await tool.execute({ orderNumber: "ORD-999" });

      expect(result).toEqual({
        error: "Order not found or you don't have permission to view it",
      });
    });

    it("should fetch specific order by order number for user", async () => {
      const userId = "user_123";
      const tool = createFetchOrderDetailsTool(userId);

      mockPrisma.order.findFirst.mockResolvedValue({
        orderNumber: "ORD-001",
        status: "shipped",
        totalAmount: 100,
        user: { name: "Alice" },
        payments: [],
      });

      const result = await tool.execute({ orderNumber: "ORD-001" });

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            orderNumber: "ORD-001",
            user: { userId },
          },
        })
      );
      expect(result.orderNumber).toBe("ORD-001");
      expect(result.customerName).toBe("Alice");
    });
  });

  describe("checkRefundStatus Tool", () => {
    it("should search refund by product name", async () => {
      const userId = "user_123";
      const tool = createCheckRefundStatusTool(userId);

      mockPrisma.payment.findMany.mockResolvedValue([
        {
          transactionId: "TXN-001",
          refunds: [
            { amount: 50, status: "processed", reason: "Defective item" },
          ],
          order: { orderNumber: "ORD-001", items: '[{"name": "Bluetooth Speaker"}]' },
          user: { name: "Alice" },
        },
      ]);

      const result = await tool.execute({
        transactionId: undefined,
        orderNumber: undefined,
        productName: "Bluetooth Speaker",
      });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { userId } },
        })
      );
    });

    it("should only access payments for the specific user", async () => {
      const userId = "user_456";
      const tool = createCheckRefundStatusTool(userId);

      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await tool.execute({ transactionId: "TXN-999" });

      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            transactionId: "TXN-999",
            user: { userId },
          },
        })
      );
    });
  });

  describe("getInvoiceDetails Tool", () => {
    it("should only access invoices for the specific user's payments", async () => {
      const userId = "user_789";
      const tool = createGetInvoiceDetailsTool(userId);

      mockPrisma.invoice.findFirst.mockResolvedValue({
        invoiceNumber: "INV-001",
        amount: 100,
        status: "paid",
        payment: {
          order: { orderNumber: "ORD-001" },
          user: { name: "Bob", email: "bob@example.com" },
        },
      });

      await tool.execute({ invoiceNumber: "INV-001" });

      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            invoiceNumber: "INV-001",
            payment: {
              user: { userId },
            },
          },
        })
      );
    });
  });

  describe("User Data Isolation Security", () => {
    it("should never expose data across user boundaries", async () => {
      const userA = "user_A";
      const userB = "user_B";

      const toolA = createFetchOrderDetailsTool(userA);
      const toolB = createFetchOrderDetailsTool(userB);

      // User A's orders
      mockPrisma.order.findMany.mockResolvedValue([
        { orderNumber: "ORD-A1", status: "delivered", user: { name: "Alice" } },
      ]);

      const resultA = await toolA.execute({});

      // Reset mock for User B
      mockPrisma.order.findMany.mockResolvedValue([
        { orderNumber: "ORD-B1", status: "pending", user: { name: "Bob" } },
      ]);

      const resultB = await toolB.execute({});

      // Verify each user only sees their own orders
      expect(resultA[0].orderNumber).toBe("ORD-A1");
      expect(resultB[0].orderNumber).toBe("ORD-B1");

      // Verify Prisma was called with correct userId filters
      const callsA = mockPrisma.order.findMany.mock.calls[0];
      const callsB = mockPrisma.order.findMany.mock.calls[1];

      expect(callsA[0].where.user.userId).toBe(userA);
      expect(callsB[0].where.user.userId).toBe(userB);
    });
  });
});
