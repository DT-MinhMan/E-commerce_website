import { pathToFileURL } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getConfig } from "../config/env.js";
import {
  CartModel,
  CategoryModel,
  OrderModel,
  PaymentModel,
  PaymentWebhookEventModel,
  ProductModel,
  RefreshTokenModel,
  UserModel
} from "./models.js";

const models = [
  UserModel,
  CategoryModel,
  ProductModel,
  CartModel,
  OrderModel,
  PaymentModel,
  PaymentWebhookEventModel,
  RefreshTokenModel
] as const;

export const syncDatabaseIndexes = async (): Promise<void> => {
  for (const databaseModel of models) {
    await databaseModel.syncIndexes();
    console.info(`synced indexes for ${databaseModel.collection.collectionName}`);
  }
};

const run = async (): Promise<void> => {
  const config = getConfig();
  await connectDatabase(config.mongodbUri);

  try {
    await syncDatabaseIndexes();
  } finally {
    await disconnectDatabase();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown index sync error";
    console.error(message);
    process.exit(1);
  });
}
