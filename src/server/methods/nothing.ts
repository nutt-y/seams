import { AbstractHandler } from "./abstract.ts";

/**
 * Do nothing since this means that this method is not implemented
 */
export class Nothing extends AbstractHandler {
  /**
   * Return no message
   */
  public override handle(): void {
    const { method } = this.message;
    this.logger.warn(`Method [${method}] not implemented`);
  }
}
