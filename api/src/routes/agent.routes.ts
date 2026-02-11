import { Hono } from "hono";

const router = new Hono();

// List available agents
router.get("/", (c) => {
  return c.json({
    agents: [
      {
        type: "support",
        name: "Support Agent",
        description: "Handles general support inquiries, FAQs, and troubleshooting",
        capabilities: [
          "Answer product questions",
          "Provide troubleshooting steps",
          "Check conversation history",
          "Explain company policies",
        ],
      },
      {
        type: "order",
        name: "Order Agent",
        description: "Handles order status, tracking, and modifications",
        capabilities: [
          "Check order details",
          "Track delivery status",
          "Provide shipping updates",
          "Help with order modifications",
        ],
      },
      {
        type: "billing",
        name: "Billing Agent",
        description: "Handles payment issues, refunds, and invoices",
        capabilities: [
          "Retrieve invoice details",
          "Check refund status",
          "Explain billing charges",
          "Help with payment issues",
        ],
      },
    ],
  });
});

// Get specific agent capabilities
router.get("/:type/capabilities", (c) => {
  const type = c.req.param("type");
  
  const capabilities: Record<string, any> = {
    support: {
      tools: ["queryConversationHistory"],
      topics: ["FAQs", "Troubleshooting", "Account Help", "General Inquiries"],
    },
    order: {
      tools: ["fetchOrderDetails", "checkDeliveryStatus"],
      topics: ["Order Status", "Tracking", "Shipping", "Returns"],
    },
    billing: {
      tools: ["getInvoiceDetails", "checkRefundStatus"],
      topics: ["Payments", "Refunds", "Invoices", "Subscriptions"],
    },
  };

  const caps = capabilities[type];
  if (!caps) {
    return c.json({ error: "Agent type not found" }, 404);
  }

  return c.json({ agent: type, ...caps });
});

export default router;
