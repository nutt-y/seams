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

interface WorkDoneProgressReport {
  kind: "report";
  message?: string;
  percentage?: number;
}

export class WindowWorkDoneProgress extends NotificationHandler {
  protected token: ProgressToken;
  protected started = false;

  constructor(
    project: GMLProject,
    logger: winston.Logger,
    response: ElementQueue<LSPNotificationMessage | LSPRequestMessage>,
    token?: ProgressToken,
  ) {
    super(project, logger, response);
    this.token = token ?? crypto.randomUUID();
  }

  public getToken(): ProgressToken {
    return this.token;
  }

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

  public override handle(): Promise<void> | void {
    // empty
  }
}
