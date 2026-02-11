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
  description: "Checks status of refunds by transaction ID, order number, or product name.",
  parameters: z.object({
    transactionId: z.string().optional().describe("Optional transaction ID to check"),
    orderNumber: z.string().optional().describe("Optional order number to check for refunds"),
    productName: z.string().optional().describe("Optional product name to search for refunds"),
  }),
  execute: async ({ transactionId, orderNumber, productName }) => {
    // If transactionId provided, look up directly
    if (transactionId) {
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId,
          user: { userId }
        },
        include: {
          refunds: true,
          order: { select: { orderNumber: true } },
          user: { select: { name: true } }
        },
      });

      if (!payment) {
        return { error: "Transaction not found" };
      }

      return formatRefundResponse(payment);
    }

    // If orderNumber provided, find payment via order
    if (orderNumber) {
      const payment = await prisma.payment.findFirst({
        where: {
          order: { orderNumber },
          user: { userId }
        },
        include: {
          refunds: true,
          order: { select: { orderNumber: true } },
          user: { select: { name: true } }
        },
      });

      if (!payment) {
        return { error: "No payment found for this order" };
      }

      return formatRefundResponse(payment);
    }

    // If productName provided, search through orders
    if (productName) {
      const payments = await prisma.payment.findMany({
        where: { user: { userId } },
        include: {
          refunds: true,
          order: { select: { orderNumber: true, items: true } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Find payment with matching product in items
      const matchingPayment = payments.find(p => {
        const itemsStr = p.order.items as string | null;
        const items = JSON.parse(itemsStr || "[]");
        return items.some((item: any) => 
          item.name?.toLowerCase().includes(productName.toLowerCase())
        );
      });

      if (!matchingPayment) {
        return { error: `No orders found containing "${productName}"` };
      }

      return formatRefundResponse(matchingPayment);
    }

    // No parameters - get all recent refunds
    const payments = await prisma.payment.findMany({
      where: { user: { userId } },
      include: {
        refunds: true,
        order: { select: { orderNumber: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const refunds = payments.flatMap(p => 
      p.refunds.map(r => ({
        ...r,
        orderNumber: p.order.orderNumber,
        transactionId: p.transactionId,
      }))
    );

    return refunds.length > 0 
      ? { refunds: refunds.slice(0, 5) }
      : { message: "No refunds found" };
  },
});

function formatRefundResponse(payment: any) {
  return payment.refunds.length > 0
    ? {
      customerName: payment.user.name,
      orderNumber: payment.order.orderNumber,
      transactionId: payment.transactionId,
      refunds: payment.refunds.map((r: any) => ({
        amount: r.amount,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
      })),
    }
    : {
      customerName: payment.user.name,
      orderNumber: payment.order.orderNumber,
      transactionId: payment.transactionId,
      message: "No refunds found for this transaction",
    };
}
