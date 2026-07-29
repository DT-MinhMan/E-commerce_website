import http from "node:http";
import { createApp } from "./app.js";
import { disconnectDatabase, connectDatabase } from "./config/database.js";
import { getConfig } from "./config/env.js";

const startServer = async (): Promise<void> => {
  const config = getConfig();
  const app = createApp(config);

  await connectDatabase(config.mongodbUri);

  const server = http.createServer(app);

  server.listen(config.port, () => {
    if (config.logLevel !== "silent") {
      console.info(
        JSON.stringify({
          level: "info",
          message: "Server started",
          port: config.port,
          environment: config.nodeEnv
        })
      );
    }
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (config.logLevel !== "silent") {
      console.info(JSON.stringify({ level: "info", message: "Shutdown started", signal }));
    }

    server.close(async (error) => {
      if (error) {
        console.error(JSON.stringify({ level: "error", message: "HTTP server close failed" }));
        process.exit(1);
      }

      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(JSON.stringify({ level: "error", message: "Server startup failed", error: message }));
  process.exit(1);
});
