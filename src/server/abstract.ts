import type { Code } from "@bscotch/gml-parser";
import type winston from "winston";
import type GMLProject from "../parser/project.ts";
import type { ElementQueue } from "./element_queue.ts";
import type {
  DocumentUri,
  Handler,
  LSPMessage,
  LSPRequestMessage,
} from "./methods/message.types.ts";
/**
 * Create an abstract handler this attributes that all handlers share.
 */
export abstract class AbstractHandler implements Handler {
  // The content passed down
  protected message: LSPRequestMessage;

  // Reference to the universal project
  protected project: GMLProject;

  // The logger to use
  protected logger: winston.Logger;

  // The queue for the responses to send back to the client
  protected responses: ElementQueue<LSPMessage>;

  /**
   * Create a handler with all of the information passed from the client
   * @param message The message passed and all it's content
   * @param project The gml project with api
   * @param logger The logger to quickly log information
   * @param responses The queue for the responses to send back to the client
   */
  constructor(
    message: LSPRequestMessage,
    project: GMLProject,
    logger: winston.Logger,
    responses: ElementQueue<LSPMessage>,
  ) {
    this.message = message;
    this.logger = logger;
    this.project = project;
    this.responses = responses;
  }

  /**
   * All children must implement this
   * @param params The parameters for the request
   */
  public abstract handle(): Promise<void> | void;

  /**
   * Get the path of a document given it's `uri`
   * @param uri The uri for the document (usually "file://")
   * @returns The path for the document
   */
  protected getDocumentPath(uri: DocumentUri): string {
    const [_, path] = uri.split("file://");

    return path;
  }

  /**
   * Get the file object from the given uri
   * @param uri The uri of the file to open
   * @returns The file given the file's uri
   */
  protected getFile(uri: string): Code | null {
    const path = this.getDocumentPath(uri);
    const file = this.project.getFile(path) ?? null;

    return file;
  }
}
