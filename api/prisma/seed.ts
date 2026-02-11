import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const user1 = await prisma.user.create({
    data: {
      userId: "user_1",
      name: "John Doe",
      email: "john@example.com",
      role: "customer",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      userId: "user_2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "customer",
    },
  });

  // Create orders for user 1
  const order1 = await prisma.order.create({
    data: {
      userId: user1.userId,
      orderNumber: "ORD-2024-001",
      status: "delivered",
      totalAmount: 299.99,
      items: JSON.stringify([
        { name: "Wireless Headphones", quantity: 1, price: 199.99 },
        { name: "Phone Case", quantity: 2, price: 50.0 },
      ]),
      shippingAddress: "123 Main St, New York, NY 10001",
      trackingNumber: "TRK123456789",
      estimatedDelivery: new Date("2024-02-15"),
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user1.userId,
      orderNumber: "ORD-2024-002",
      status: "shipped",
      totalAmount: 149.99,
      items: JSON.stringify([
        { name: "Bluetooth Speaker", quantity: 1, price: 149.99 },
      ]),
      shippingAddress: "123 Main St, New York, NY 10001",
      trackingNumber: "TRK987654321",
      estimatedDelivery: new Date("2024-02-20"),
    },
  });

  // Create payments
  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      userId: user1.userId,
      amount: 299.99,
      status: "completed",
      method: "credit_card",
      transactionId: "TXN-001",
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      orderId: order2.id,
      userId: user1.userId,
      amount: 149.99,
      status: "completed",
      method: "paypal",
      transactionId: "TXN-002",
    },
  });

  // Create invoice
  await prisma.invoice.create({
    data: {
      paymentId: payment1.id,
      invoiceNumber: "INV-2024-001",
      amount: 299.99,
      status: "paid",
      dueDate: new Date("2024-02-28"),
    },
  });

  // Create refund
  await prisma.refund.create({
    data: {
      paymentId: payment2.id,
      amount: 50.0,
      status: "processed",
      reason: "Item damaged during shipping",
      processedAt: new Date(),
    },
  });

  console.log("✅ Seeding completed!");
  console.log(`- Created 2 users`);
  console.log(`- Created 2 orders`);
  console.log(`- Created 2 payments`);
  console.log(`- Created 1 invoice`);
  console.log(`- Created 1 refund`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
