import { AbstractHandler } from "../abstract.ts";
import type { LSPRequestMessage } from "./message.types.ts";

/**
 * This is for messages that don't require any
 */
export class Initialized extends AbstractHandler {
  /**
   * Don't send anything back
   */
  public override handle(_?: LSPRequestMessage["params"]): void {
    this.logger.info("The LSP has been initialized");
  }
}
