import mongoose from "mongoose";
import { disconnectDatabase } from "../../src/config/database.js";
import { syncDatabaseIndexes } from "../../src/database/syncIndexes.js";

export const connectTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 5000 });
  }
};

export const clearTestDatabase = async (): Promise<void> => {
  if (!mongoose.connection.db) {
    throw new Error("Test database is not connected");
  }

  if (!mongoose.connection.name.endsWith("_test")) {
    throw new Error(`Refusing to clear non-test database: ${mongoose.connection.name}`);
  }

  await mongoose.connection.db.dropDatabase();
  await syncDatabaseIndexes();
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await disconnectDatabase();
};
