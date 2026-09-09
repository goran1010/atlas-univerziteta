import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = app.listen(env.PORT, (error) => {
  if (error) throw error;
  logger.info(`App started at port: ${env.PORT.toString()}`);
});

let shuttingDown = false;

type GracefulShutdownSignal =
  "SIGTERM" | "SIGINT" | "uncaughtException" | "unhandledRejection";

function gracefulShutdown(signal: GracefulShutdownSignal, exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.warn(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.warn("Process terminated");
    process.exit(exitCode);
  });

  setTimeout(() => {
    logger.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM", 0);
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT", 0);
});

process.on("uncaughtException", (error) => {
  logger.fatal(error, "Uncaught exception");
  gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection");
  gracefulShutdown("unhandledRejection", 1);
});
