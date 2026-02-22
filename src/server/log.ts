import * as winston from "winston";

/**
 * Create a logging instance that can be used to log content to a seperate file (for debugging purposes)
 * @param filename The name of the file to hold all logging content
 * @return logger
 */
export const getLogger = (filename: string): winston.Logger => {
  try {
    Deno.removeSync(filename);
  } catch {
    // File doesn't exist yet
  }

  const logger = winston.createLogger({
    level: "info",
    transports: [
      new winston.transports.File({
        filename: filename,
        format: winston.format.combine(
          winston.format.label({ label: "GML" }),
          winston.format.timestamp(),
          winston.format.printf(
            ({ level, message, label, timestamp }) =>
              `[${label}] ${timestamp} ${level}: ${message}`,
          ),
        ),
      }),
    ],
  });

  // Start the first log
  logger.info("Started GML Lsp");

  return logger;
};
