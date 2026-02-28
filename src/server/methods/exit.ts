import { AbstractHandler } from "../abstract.ts";

/**
 * Exit handler
 */
export class Exit extends AbstractHandler {
  /**
   * Exit the lsp
   */
  public override handle(): void {
    Deno.exit(0);
  }
}
