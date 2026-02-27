import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import { NotificationHandler } from "../abstract.ts";
import { RPC_VER } from "../constants.ts";
import type { ElementQueue } from "../element_queue.ts";
import type {
  LSPNotificationMessage,
  LSPRequestMessage,
  ProgressParams,
  ProgressToken,
  WorkDoneProgressBegin,
  WorkDoneProgressEnd,
} from "../methods/message.types.ts";

/**
 * Hold a state for the work done progress
 */
interface WorkDoneProgressReport {
  kind: "report";
  message?: string;
  percentage?: number;
}

/**
 * @class WindowWorkDoneProgress sends back progress for a resource heavy work
 */
export class WindowWorkDoneProgress extends NotificationHandler {
  // The token to use to keep track of progress
  protected token: ProgressToken;

  // Keep track if the progress has started
  protected started = false;

  /**
   * @param project The gml project api wrapper
   * @param logger The logger to use for debugging
   * @param response The response queue
   * @param token The token to use
   */
  constructor(
    project: GMLProject,
    logger: winston.Logger,
    response: ElementQueue<LSPNotificationMessage | LSPRequestMessage>,
    token?: ProgressToken,
  ) {
    super(project, logger, response);
    this.token = token ?? crypto.randomUUID();
  }

  /**
   * @returns The token to use to keep track
   */
  public getToken(): ProgressToken {
    return this.token;
  }

  /**
   * Begin work and keep track of it
   * @param title The title to use for the client return
   * @param cancellable Whether the work can be cancellable
   */
  public begin(title: string, cancellable = false): void {
    this.response.enqueueElement([
      {
        id: 0,
        jsonrpc: RPC_VER,
        method: "window/workDoneProgress/create",
        params: {
          token: this.token,
        },
      } as LSPRequestMessage,
      {
        jsonrpc: RPC_VER,
        method: "$/progress",
        params: {
          token: this.token,
          value: {
            kind: "begin",
            title,
            cancellable,
          } satisfies WorkDoneProgressBegin,
        } satisfies ProgressParams<WorkDoneProgressBegin>,
      } as LSPNotificationMessage,
    ]);

    this.started = true;
  }

  /**
   * Send back to the client a report for the work that is being done
   * @param message The message to send back
   * @param percentage The percentage to show, a number between 0-100
   */
  public report(message: string, percentage?: number): void {
    if (!this.started) return;

    this.response.enqueueElement([
      {
        jsonrpc: RPC_VER,
        method: "$/progress",
        params: {
          token: this.token,
          value: {
            kind: "report",
            message,
            percentage,
          } satisfies WorkDoneProgressReport,
        } satisfies ProgressParams<WorkDoneProgressReport>,
      } as LSPNotificationMessage,
    ]);
  }

  /**
   * Send to the client that the work has finished
   * @param message The message to send back to the client
   */
  public end(message?: string): void {
    if (!this.started) return;

    this.response.enqueueElement([
      {
        jsonrpc: RPC_VER,
        method: "$/progress",
        params: {
          token: this.token,
          value: {
            kind: "end",
            message,
          } satisfies WorkDoneProgressEnd,
        } satisfies ProgressParams<WorkDoneProgressEnd>,
      } as LSPNotificationMessage,
    ]);
  }

  /**
   * Not using this at the moment, so just empty for now
   */
  public override handle(): Promise<void> | void {
    // empty
  }
}
