import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with Users and associated data...\n");

  // Clear existing data (order matters due to foreign keys)
  console.log("🧹 Clearing existing data...");
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared\n");

  // ============ Create Users First ============
  console.log("👥 Creating Users...");
  
  const alice = await prisma.user.create({
    data: {
      userId: "user_1",
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Premium Customer",
    },
  });
  console.log(`  ✅ Created: ${alice.name} (${alice.userId})`);

  const bob = await prisma.user.create({
    data: {
      userId: "user_2",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "Regular Customer",
    },
  });
  console.log(`  ✅ Created: ${bob.name} (${bob.userId})`);

  const charlie = await prisma.user.create({
    data: {
      userId: "user_3",
      name: "Charlie Brown",
      email: "charlie@example.com",
      role: "New Customer",
    },
  });
  console.log(`  ✅ Created: ${charlie.name} (${charlie.userId})\n`);

  // ============ ALICE'S DATA ============
  console.log("📦 Creating Alice's data...");
  
  const aliceOrders = await Promise.all([
    prisma.order.create({
      data: {
        userId: alice.userId,
        orderNumber: "ORD-1001",
        status: "delivered",
        totalAmount: 299.99,
        items: JSON.stringify([
          { name: "Wireless Headphones Pro", quantity: 1, price: 199.99 },
          { name: "USB-C Cable", quantity: 2, price: 50.00 },
        ]),
        shippingAddress: "123 Oak Street, New York, NY 10001",
        trackingNumber: "TRK-999888777",
        estimatedDelivery: new Date("2026-01-15"),
        createdAt: new Date("2026-01-10"),
      },
    }),
    prisma.order.create({
      data: {
        userId: alice.userId,
        orderNumber: "ORD-1002",
        status: "shipped",
        totalAmount: 599.00,
        items: JSON.stringify([
          { name: "Mechanical Keyboard", quantity: 1, price: 149.00 },
          { name: "4K Monitor 27\"", quantity: 1, price: 450.00 },
        ]),
        shippingAddress: "123 Oak Street, New York, NY 10001",
        trackingNumber: "TRK-888777666",
        estimatedDelivery: new Date("2026-02-15"),
        createdAt: new Date("2026-02-10"),
      },
    }),
    prisma.order.create({
      data: {
        userId: alice.userId,
        orderNumber: "ORD-1003",
        status: "processing",
        totalAmount: 89.99,
        items: JSON.stringify([
          { name: "Ergonomic Mouse Pad", quantity: 1, price: 29.99 },
          { name: "Webcam HD", quantity: 1, price: 60.00 },
        ]),
        shippingAddress: "123 Oak Street, New York, NY 10001",
        estimatedDelivery: new Date("2026-02-20"),
        createdAt: new Date("2026-02-11"),
      },
    }),
    prisma.order.create({
      data: {
        userId: alice.userId,
        orderNumber: "ORD-1004",
        status: "cancelled",
        totalAmount: 1299.00,
        items: JSON.stringify([
          { name: "Gaming Laptop", quantity: 1, price: 1299.00 },
        ]),
        shippingAddress: "123 Oak Street, New York, NY 10001",
        createdAt: new Date("2026-01-05"),
      },
    }),
  ]);

  const alicePayment1 = await prisma.payment.create({
    data: {
      orderId: aliceOrders[0].id,
      userId: alice.userId,
      amount: 299.99,
      status: "completed",
      method: "credit_card",
      transactionId: "TXN-ALICE-001",
      createdAt: new Date("2026-01-10"),
    },
  });
  
  const alicePayment2 = await prisma.payment.create({
    data: {
      orderId: aliceOrders[1].id,
      userId: alice.userId,
      amount: 599.00,
      status: "completed",
      method: "paypal",
      transactionId: "TXN-ALICE-002",
      createdAt: new Date("2026-02-10"),
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        paymentId: alicePayment1.id,
        invoiceNumber: "INV-ALICE-001",
        amount: 299.99,
        status: "paid",
        issuedAt: new Date("2026-01-10"),
        dueDate: new Date("2026-02-10"),
      },
      {
        paymentId: alicePayment2.id,
        invoiceNumber: "INV-ALICE-002",
        amount: 599.00,
        status: "paid",
        issuedAt: new Date("2026-02-10"),
        dueDate: new Date("2026-03-10"),
      },
    ],
  });

  await prisma.conversation.create({
    data: {
      userId: alice.userId,
      title: "Order tracking help",
      agentType: "order",
      messages: {
        create: [
          { role: "user", content: "Where is my order ORD-1002?", createdAt: new Date("2026-02-12T10:00:00Z") },
          { role: "assistant", content: "Let me check that for you. I can see order ORD-1002 with the 4K Monitor and Mechanical Keyboard was shipped on Feb 10th.", agentType: "order", createdAt: new Date("2026-02-12T10:00:05Z") },
          { role: "user", content: "When will it arrive?", createdAt: new Date("2026-02-12T10:00:30Z") },
          { role: "assistant", content: "Your order is expected to arrive on February 15th, 2026. The tracking number is TRK-888777666.", agentType: "order", createdAt: new Date("2026-02-12T10:00:35Z") },
        ],
      },
    },
  });
  console.log("  ✅ Alice: 4 orders, 2 payments, 2 invoices, 1 conversation\n");

  // ============ BOB'S DATA ============
  console.log("📦 Creating Bob's data...");
  
  const bobOrders = await Promise.all([
    prisma.order.create({
      data: {
        userId: bob.userId,
        orderNumber: "ORD-2001",
        status: "pending",
        totalAmount: 45.99,
        items: JSON.stringify([
          { name: "Phone Case", quantity: 1, price: 15.99 },
          { name: "Screen Protector", quantity: 2, price: 15.00 },
        ]),
        shippingAddress: "456 Maple Ave, Los Angeles, CA 90001",
        estimatedDelivery: new Date("2026-02-25"),
        createdAt: new Date("2026-02-09"),
      },
    }),
    prisma.order.create({
      data: {
        userId: bob.userId,
        orderNumber: "ORD-2002",
        status: "delivered",
        totalAmount: 159.99,
        items: JSON.stringify([
          { name: "Bluetooth Speaker", quantity: 1, price: 79.99 },
          { name: "Power Bank 20000mAh", quantity: 1, price: 80.00 },
        ]),
        shippingAddress: "456 Maple Ave, Los Angeles, CA 90001",
        trackingNumber: "TRK-777666555",
        estimatedDelivery: new Date("2026-01-20"),
        createdAt: new Date("2026-01-15"),
      },
    }),
  ]);

  const bobPayment1 = await prisma.payment.create({
    data: {
      orderId: bobOrders[0].id,
      userId: bob.userId,
      amount: 45.99,
      status: "pending",
      method: "credit_card",
      transactionId: "TXN-BOB-001",
      createdAt: new Date("2026-02-09"),
    },
  });
  
  const bobPayment2 = await prisma.payment.create({
    data: {
      orderId: bobOrders[1].id,
      userId: bob.userId,
      amount: 159.99,
      status: "completed",
      method: "bank_transfer",
      transactionId: "TXN-BOB-002",
      createdAt: new Date("2026-01-15"),
    },
  });

  await prisma.invoice.create({
    data: {
      paymentId: bobPayment2.id,
      invoiceNumber: "INV-BOB-001",
      amount: 159.99,
      status: "paid",
      issuedAt: new Date("2026-01-15"),
      dueDate: new Date("2026-02-15"),
    },
  });

  await prisma.refund.create({
    data: {
      paymentId: bobPayment2.id,
      amount: 79.99,
      status: "processed",
      reason: "Bluetooth Speaker was defective - returned",
      createdAt: new Date("2026-01-25"),
      processedAt: new Date("2026-01-28"),
    },
  });

  await prisma.conversation.create({
    data: {
      userId: bob.userId,
      title: "Refund inquiry",
      agentType: "billing",
      messages: {
        create: [
          { role: "user", content: "I returned the Bluetooth Speaker from order ORD-2002 because it was defective. Where is my refund?", createdAt: new Date("2026-01-30T14:00:00Z") },
          { role: "assistant", content: "I can see your return was processed. A refund of $79.99 was issued to your original payment method on January 28th.", agentType: "billing", createdAt: new Date("2026-01-30T14:00:05Z") },
          { role: "user", content: "When will I see it in my account?", createdAt: new Date("2026-01-30T14:00:30Z") },
          { role: "assistant", content: "Bank transfers typically take 3-5 business days. You should see the refund by February 2nd.", agentType: "billing", createdAt: new Date("2026-01-30T14:00:35Z") },
        ],
      },
    },
  });
  console.log("  ✅ Bob: 2 orders, 2 payments, 1 invoice, 1 refund, 1 conversation\n");

  // ============ CHARLIE'S DATA ============
  console.log("📦 Creating Charlie's data...");
  
  const charlieOrder = await prisma.order.create({
    data: {
      userId: charlie.userId,
      orderNumber: "ORD-3001",
      status: "pending",
      totalAmount: 24.99,
      items: JSON.stringify([
        { name: "Laptop Stand", quantity: 1, price: 24.99 },
      ]),
      shippingAddress: "789 Pine Road, Chicago, IL 60601",
      estimatedDelivery: new Date("2026-02-28"),
      createdAt: new Date("2026-02-11"),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: charlieOrder.id,
      userId: charlie.userId,
      amount: 24.99,
      status: "failed",
      method: "credit_card",
      transactionId: "TXN-CHARLIE-001",
      createdAt: new Date("2026-02-11"),
    },
  });

  await prisma.conversation.create({
    data: {
      userId: charlie.userId,
      title: "Payment issue",
      agentType: "billing",
      messages: {
        create: [
          { role: "user", content: "Hi, I tried to order a laptop stand yesterday but my payment failed. Can you help?", createdAt: new Date("2026-02-12T09:00:00Z") },
          { role: "assistant", content: "I can see order ORD-3001 for $24.99 had a failed payment. The transaction ID is TXN-CHARLIE-001.", agentType: "billing", createdAt: new Date("2026-02-12T09:00:05Z") },
          { role: "user", content: "Can I try paying again?", createdAt: new Date("2026-02-12T09:00:30Z") },
          { role: "assistant", content: "Yes! You can update your payment method in your account settings and retry the payment for order ORD-3001.", agentType: "billing", createdAt: new Date("2026-02-12T09:00:35Z") },
        ],
      },
    },
  });
  console.log("  ✅ Charlie: 1 order, 1 failed payment, 1 conversation\n");

  console.log("🎉 Seeding completed successfully!");
  console.log("\n📊 Final Summary:");
  console.log("  • Alice (Premium): 4 orders, 2 payments, 2 invoices, 0 refunds");
  console.log("  • Bob (Regular): 2 orders, 2 payments, 1 invoice, 1 refund");
  console.log("  • Charlie (New): 1 order, 1 failed payment, 0 invoices, 0 refunds");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
