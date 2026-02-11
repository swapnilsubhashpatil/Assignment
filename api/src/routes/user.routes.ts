import { Hono } from "hono";
import { prisma } from "../db/client.js";

export const userRoutes = new Hono();

userRoutes.get("/", async (c) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return c.json({
      users: users.map((u) => ({
        id: u.userId,
        name: u.name,
        email: u.email,
        role: u.role,
        stats: {
          orderCount: u._count.orders,
          conversationCount: u._count.conversations,
        },
      })),
    });
  } catch {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

userRoutes.get("/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        conversations: {
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            agentType: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            payments: true,
            conversations: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        stats: {
          orderCount: user._count.orders,
          paymentCount: user._count.payments,
          conversationCount: user._count.conversations,
        },
        recentOrders: user.orders,
        recentConversations: user.conversations,
      },
    });
  } catch {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});
