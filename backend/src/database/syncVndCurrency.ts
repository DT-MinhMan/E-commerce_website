import { pathToFileURL } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getConfig } from "../config/env.js";
import { DEFAULT_CURRENCY } from "./enums.js";
import { OrderModel, PaymentModel, ProductModel } from "./models.js";

interface SyncResult {
  productsUpdated: number;
  ordersUpdated: number;
  paymentsUpdated: number;
}

export const syncVndCurrency = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    productsUpdated: 0,
    ordersUpdated: 0,
    paymentsUpdated: 0
  };

  // 1. Sync Products
  const products = await ProductModel.find({}).exec();
  for (const product of products) {
    let modified = false;

    // If currency is not VND
    if (product.currency !== DEFAULT_CURRENCY) {
      product.currency = DEFAULT_CURRENCY;
      modified = true;
    }

    // If priceMinor is in old USD cent range (e.g., < 100,000), convert to VND (x100)
    // Example: 89900 cents ($899) -> 8,990,000 VND
    if (product.priceMinor < 100000) {
      product.priceMinor = Math.max(product.priceMinor * 100, 50000);
      modified = true;
    }

    if (modified) {
      await product.save();
      result.productsUpdated += 1;
    }
  }

  // 2. Sync Orders
  const orders = await OrderModel.find({ currency: { $ne: DEFAULT_CURRENCY } }).exec();
  for (const order of orders) {
    order.currency = DEFAULT_CURRENCY;
    await order.save();
    result.ordersUpdated += 1;
  }

  // 3. Sync Payments
  const payments = await PaymentModel.find({ currency: { $ne: DEFAULT_CURRENCY } }).exec();
  for (const payment of payments) {
    payment.currency = DEFAULT_CURRENCY;
    await payment.save();
    result.paymentsUpdated += 1;
  }

  return result;
};

const run = async (): Promise<void> => {
  const config = getConfig();
  await connectDatabase(config.mongodbUri);
  console.log("Starting VND currency synchronization...");
  const result = await syncVndCurrency();
  console.log("VND synchronization completed successfully:");
  console.log(`- Products updated: ${result.productsUpdated}`);
  console.log(`- Orders updated: ${result.ordersUpdated}`);
  console.log(`- Payments updated: ${result.paymentsUpdated}`);
  await disconnectDatabase();
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error("VND synchronization failed:", error);
    process.exit(1);
  });
}

