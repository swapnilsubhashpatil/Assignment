import { tool } from "ai";
import { z } from "zod";
import { prisma } from "../../db/client.js";

export const createQueryConversationHistoryTool = (userId: string) => tool({
  description: "Fetches past conversation history for the current user.",
  parameters: z.object({
    limit: z.number().default(5).describe("Number of conversations to fetch"),
  }),
  execute: async ({ limit }) => {
    const conversations = await prisma.conversation.findMany({
      where: {
        user: {
          userId: userId // Using the User relation
        }
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { name: true, email: true }
        },
        messages: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      userName: c.user.name,
      lastAgent: c.agentType,
      messages: c.messages.map(
        (m) => `${m.role}: ${m.content.slice(0, 50)}...`,
      ),
    }));
  },
});

// Order Tool Factories
export const createFetchOrderDetailsTool = (userId: string) => tool({
  description: "Fetches details of an order by order number or for the current user.",
  parameters: z.object({
    orderNumber: z.string().optional().describe("Optional order number to look up"),
  }),
  execute: async ({ orderNumber }) => {
    if (orderNumber) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          user: {
            userId: userId
          }
        },
        include: {
          payments: true,
          user: {
            select: { name: true, email: true }
          }
        },
      });

      if (!order) {
        return { error: "Order not found or you don't have permission to view it" };
      }

      return {
        ...order,
        customerName: order.user.name,
      };
    }

    const orders = await prisma.order.findMany({
      where: { user: { userId } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return orders.length > 0
      ? orders.map(o => ({
        ...o,
        customerName: o.user.name,
      }))
      : { message: "No recent orders found" };
  },
});

export const createCheckDeliveryStatusTool = (userId: string) => tool({
  description: "Checks delivery status and tracking for an order.",
  parameters: z.object({
    orderNumber: z.string().describe("The order number to check"),
  }),
  execute: async ({ orderNumber }) => {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        user: {
          userId: userId // Using the User relation
        }
      },
      select: {
        orderNumber: true,
        status: true,
        trackingNumber: true,
        estimatedDelivery: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return { error: "Order not found or you don't have permission to view it" };
    }

    return order;
  },
});

// Billing Tool Factories
export const createGetInvoiceDetailsTool = (userId: string) => tool({
  description: "Fetches invoice details.",
  parameters: z.object({
    invoiceNumber: z.string().describe("The invoice number to look up"),
  }),
  execute: async ({ invoiceNumber }) => {
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber,
        payment: {
          user: {
            userId: userId // Using the User relation
          }
        },
      },
      include: {
        payment: {
          include: {
            order: true,
            user: {
              select: { name: true, email: true }
            }
          },
        },
      },
    });

    if (!invoice) {
      return { error: "Invoice not found or you don't have permission to view it" };
    }

    return {
      ...invoice,
      customerName: invoice.payment.user.name,
      customerEmail: invoice.payment.user.email,
    };
  },
});

export const createCheckRefundStatusTool = (userId: string) => tool({
  description: "Checks status of a refund.",
  parameters: z.object({
    transactionId: z.string().describe("The transaction ID to check for refunds"),
  }),
  execute: async ({ transactionId }) => {
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId,
        user: {
          userId: userId // Using the User relation
        }
      },
      include: {
        refunds: true,
        order: {
          select: { orderNumber: true },
        },
        user: {
          select: { name: true }
        }
      },
    });

    if (!payment) {
      return { error: "Transaction not found or you don't have permission to view it" };
    }

    return payment.refunds.length > 0
      ? {
        customerName: payment.user.name,
        orderNumber: payment.order.orderNumber,
        refunds: payment.refunds,
      }
      : {
        customerName: payment.user.name,
        orderNumber: payment.order.orderNumber,
        message: "No refunds found for this transaction",
      };
  },
});
