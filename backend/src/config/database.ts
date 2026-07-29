import mongoose from "mongoose";

export const connectDatabase = async (mongodbUri: string): Promise<void> => {
  try {
    await mongoose.connect(mongodbUri);
    console.info(
      JSON.stringify({
        level: "info",
        message: "MongoDB connected"
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";
    console.error(JSON.stringify({ level: "error", message: "MongoDB connection failed", error: message }));
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const getDatabaseStatus = (): "connected" | "disconnected" => {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
};
