import mongoose from "mongoose";
import { getConfig } from "../src/config/env.js";
import { OrderModel } from "../src/modules/orders/order.model.js";
import { PaymentModel } from "../src/modules/payments/payment.model.js";

async function runMigration() {
  const config = getConfig();
  console.log("Connecting to database for status separation migration...");
  await mongoose.connect(config.mongodbUri);

  try {
    // 1. Migrate Order documents
    const orders = await OrderModel.find({}).exec();
    console.log(`Found ${orders.length} orders to inspect.`);

    let migratedOrdersCount = 0;
    for (const order of orders) {
      const updates: Record<string, unknown> = {};

      if (!order.paymentMethod) {
        updates.paymentMethod = "CARD";
      }

      const status = order.orderStatus as string;
      if (status === "PENDING_PAYMENT" || status === "PAID" || status === "PAYMENT_REVIEW") {
        updates.orderStatus = "PENDING";
        if (status === "PAID" || status === "PAYMENT_REVIEW") {
          updates.paymentStatus = "PAID";
        }
      } else if (status === "REFUNDED") {
        updates.orderStatus = "CANCELLED";
        updates.paymentStatus = "REFUNDED";
      }

      if (Object.keys(updates).length > 0) {
        await OrderModel.updateOne({ _id: order._id }, { $set: updates }).exec();
        migratedOrdersCount++;
      }
    }
    console.log(`Migrated ${migratedOrdersCount} orders.`);

    // 2. Migrate Payment documents
    const paymentResult = await PaymentModel.updateMany(
      { status: "SUCCEEDED" },
      { $set: { status: "PAID" } }
    ).exec();
    console.log(`Updated ${paymentResult.modifiedCount} payment documents (SUCCEEDED -> PAID).`);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

void runMigration();
