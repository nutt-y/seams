import type winston from "winston";
import GMLProject from "../parser/project.ts";
import { ElementQueue } from "../server/element_queue.ts";
import { getLogger } from "../server/log.ts";
import { handleMessage } from "../server/methods/message.ts";
import type { LSPMessage } from "../server/methods/message.types.ts";
import { decodeMessage, encodeMessage } from "../server/rpc.ts";
import { nextMessage, sendReply } from "../server/scanner.ts";

/**
 * @class The entry point to the program, based on the flags and conditions listed
 */
export abstract class Program {
  /**
   * Run's the program
   */
  abstract run(): void;
}

/**
 * @class Help just prints out the content of the binary
 */
export class HelpProgram extends Program {
  /**
   * Print out the help menu
   */
  override run(): Promise<void> | void {
    throw new Error("Method not implemented.");
  }
}

/**
 * @class Lsp class to use
 */
export class LspProgram extends Program {
  /**
   * Whether the lsp should start in debug mode or not
   */
  private logger: winston.Logger = this.getDefaultLogFile();

  /**
   * Get the logger file contents
   * @returns The winston object with the files logged if it exists
   */
  public get log(): winston.Logger | null {
    return this.logger;
  }

  /**
   * Set the log based on the file provided
   * @param file The file that will be used for logging
   */
  public set log(file: string) {
    if (file.length > 0) {
      this.logger = getLogger(file);
    }
  }

  /**
   * Run the lsp program
   */
  public override async run(): Promise<void> {
    // Constants
    const project: GMLProject = new GMLProject(this.logger); // Reference the wrapper for the gml parser
    const responses: ElementQueue<LSPMessage> = new ElementQueue<LSPMessage>(); // All responses for the client are added to an event listener queue

    // Add the replies to send when they are available
    responses.addEventListener(ElementQueue.Events.ITEMSADDED, async (e) => {
      const event = e as CustomEvent<{
        items: LSPMessage[];
        queue: LSPMessage[];
      }>;

      const { items } = event.detail;

      for (const response of items) {
        const reply = encodeMessage(response, this.logger);

        await sendReply(reply);

        this.logger.info(`Reply Sent: \n${JSON.stringify(response, null, 2)}`);
      }
    });

    // Sentinel Loop
    for await (const message of nextMessage()) {
      const request = decodeMessage(message, this.logger);

      // Log that the lsp has started
      this.logger.info(
        `Method: ${request.method}\nContent: ${JSON.stringify(request, null, 2)}`,
      );

      await handleMessage({
        method: request.method,
        message: request,
        logger: this.logger,
        project: project,
        responses: responses,
      });
    }
  }

  /**
   * Get all the log debugging information and place it in a default
   * temp file
   * @returns `winston` Logger object to use
   */
  private getDefaultLogFile(): winston.Logger {
    // Get the directory
    const dir = Deno.makeTempDirSync({ prefix: "gml-lsp" });
    const logger = getLogger(`${dir}/debug.log`);

    return logger;
  }
}
