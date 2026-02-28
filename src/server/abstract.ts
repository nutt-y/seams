import type { Code } from "@bscotch/gml-parser";
import type winston from "winston";
import type GMLProject from "../parser/project.ts";
import { RPC_VER } from "./constants.ts";
import type { ElementQueue } from "./element_queue.ts";
import {
  DocumentUri,
  ErrorCodes,
  Handler,
  LSPMessage,
  LSPNotificationMessage,
  LSPRequestMessage,
  LSPResponseMessage,
  ResponseError,
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

  // The message id passed down to the user
  protected id: string | number;

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

    this.id = message.id;
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

  /**
   * Generate a response message to send back to the client
   * @param obj Contains the `result` and `error` objects to send back to the client, note that you only have to send one,
   * @returns The response message to send backt to the client
   */
  protected generateResponseMessage({
    result = undefined,
    error = undefined,
  }:
    | {
        result: unknown | undefined;
        error?: undefined;
      }
    | {
        result?: undefined;
        error: LSPResponseMessage["error"];
      }): LSPResponseMessage {
    const message: LSPResponseMessage = {
      id: this.id,
      jsonrpc: RPC_VER,
      result: result as LSPResponseMessage["result"],
      error: error,
    };

    return message;
  }

  /**
   * Queue the respones message to be sent to the client
   * @param message Queue up the response message back to the client
   */
  protected queueResponseMessage(
    message: LSPResponseMessage | LSPResponseMessage[],
  ): void {
    this.responses.enqueueElement(Array.isArray(message) ? message : [message]);
  }

  /**
   * Generate an error with the following code and message, this can be returned to the client
   * @param code The error code to generate
   * @param message The message for the error
   * @returns A `ResponseError` that can be sent back to a client
   */
  protected generateError(
    code: keyof typeof ErrorCodes,
    message: string,
  ): ResponseError {
    const error: ResponseError = {
      code: ErrorCodes[code],
      message: message,
    };

    return error;
  }
}

/**
 * @class NotificationHandler replies to the user with a notification that
 * can be sent at any moment
 */
export abstract class NotificationHandler implements Handler {
  // Reference to the universal project
  protected project: GMLProject;

  // The logger to use
  protected logger: winston.Logger;

  // The queue for the response to send back to the client
  protected response: ElementQueue<LSPMessage>;

  // Keep track of all Notification requests based on token sent
  public static progress: Map<string, NotificationHandler> = new Map();

  /**
   * Create a notification to send the client any information required
   * @param project The gml project api
   * @param response The response queue to use for sending back information
   * @param logger Logger to use
   */
  constructor(
    project: GMLProject,
    logger: winston.Logger,
    response: ElementQueue<LSPMessage>,
  ) {
    this.project = project;
    this.logger = logger;
    this.response = response;
  }

  /**
   * All children must implement this
   */
  public abstract handle(): Promise<void> | void;

  /**
   * Generate a notification message to send back to the client
   * @param method The method type to generate the notification message for
   * @param [params=undefined] The parameters to include in the notification message
   */
  protected generateNotificationMessage(
    method: string,
    params: unknown | undefined = undefined,
  ): LSPNotificationMessage {
    const notification: LSPNotificationMessage = {
      jsonrpc: RPC_VER,
      method: method,
      params: params as LSPNotificationMessage["params"],
    };

    return notification;
  }

  /**
   * Queue the notification to be sent back to the client
   * @param notification Queue up the notification
   */
  protected queueNotification(
    notification: LSPNotificationMessage | LSPNotificationMessage[],
  ): void {
    this.response.enqueueElement(
      Array.isArray(notification) ? notification : [notification],
    );
  }
}
