import GMLProject from "./src/parser/project.ts";
import { ElementQueue } from "./src/server/element_queue.ts";
import { getLogger } from "./src/server/log.ts";
import { handleMessage } from "./src/server/methods/message.ts";
import type { LSPMessage } from "./src/server/methods/message.types.ts";
import { decodeMessage, encodeMessage } from "./src/server/rpc.ts";
import { nextMessage, sendReply } from "./src/server/scanner.ts";

/**
 * Main process
 */
const main = async () => {
  // Start logger
  const logFile = `${Deno.cwd()}/debug.log`;
  const logger = getLogger(logFile);

  // Constants
  const project: GMLProject = new GMLProject(logger); // Reference the project that is to be instantiated
  const responses: ElementQueue<LSPMessage> = new ElementQueue<LSPMessage>();

  // Add the replies to send when they are available
  responses.addEventListener(ElementQueue.Events.ITEMSADDED, async (e) => {
    const event = e as CustomEvent<{
      items: LSPMessage[];
      queue: LSPMessage[];
    }>;

    const { items } = event.detail;

    for (const response of items) {
      const reply = encodeMessage(response, logger);

      await sendReply(reply);

      logger.info(`Reply Sent: \n${JSON.stringify(response, null, 2)}`);
    }
  });

  // Sentinel loop
  for await (const message of nextMessage()) {
    const request = decodeMessage(message, logger);

    // Log that the lsp has started
    logger.info(
      `Method: ${request.method}\nContent: ${JSON.stringify(request, null, 2)}`,
    );

    await handleMessage({
      method: request.method,
      message: request,
      logger: logger,
      project: project,
      responses: responses,
    });
  }

  logger.info("Program Finished");
};

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main();
}
