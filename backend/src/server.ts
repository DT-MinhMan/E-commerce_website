import http from "node:http";
import { logger } from "./common/logger.js";
import { createApp } from "./app.js";
import { disconnectDatabase, connectDatabase } from "./config/database.js";
import { getConfig } from "./config/env.js";

const startServer = async (): Promise<void> => {
  const config = getConfig();
  const app = createApp(config);

  await connectDatabase(config.mongodbUri, config);

  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(config, "Server started", { port: config.port, environment: config.nodeEnv });
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(config, "Shutdown started", { signal });

    server.close(async (error) => {
      if (error) {
        logger.error(config, "HTTP server close failed");
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
  logger.error({ logLevel: "error" }, "Server startup failed", { error: message });
  process.exit(1);
});
