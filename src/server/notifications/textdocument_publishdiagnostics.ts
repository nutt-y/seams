import { NotificationHandler } from "../abstract.ts";

/**
 * @class Get diagnostics for a specific file and send it back to the client
 */
export class TextDocument_PublishDiagnostics extends NotificationHandler {
  /**
   * Publish
   */
  public override handle(): Promise<void> | void {
    throw new Error("Method not implemented.");
  }
}
