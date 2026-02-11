import { Hono } from "hono";

export const agentRoutes = new Hono();

const agentDefinitions: Record<
  string,
  { description: string; tools: { name: string; description: string }[] }
> = {
  support: {
    description:
      "Handles general support inquiries, FAQs, and troubleshooting",
    tools: [
      {
        name: "queryConversationHistory",
        description: "Fetches past conversation history for the current user",
      },
    ],
  },
  order: {
    description:
      "Handles order status, tracking, modifications, and cancellations",
    tools: [
      {
        name: "fetchOrderDetails",
        description:
          "Fetches details of an order by order number or for the current user",
      },
      {
        name: "checkDeliveryStatus",
        description: "Checks delivery status and tracking for an order",
      },
    ],
  },
  billing: {
    description:
      "Handles payment issues, refunds, invoices, and subscription queries",
    tools: [
      {
        name: "getInvoiceDetails",
        description: "Fetches invoice details by invoice number",
      },
      {
        name: "checkRefundStatus",
        description: "Checks status of a refund by transaction ID",
      },
    ],
  },
};

agentRoutes.get("/", (c) =>
  c.json({
    agents: Object.entries(agentDefinitions).map(([type, def]) => ({
      type,
      description: def.description,
      toolCount: def.tools.length,
    })),
  }),
);

agentRoutes.get("/:type/capabilities", (c) => {
  const type = c.req.param("type");
  const agent = agentDefinitions[type];

  if (!agent) {
    return c.json({ error: `Agent type "${type}" not found` }, 404);
  }

  return c.json({
    type,
    description: agent.description,
    capabilities: agent.tools,
  });
});
