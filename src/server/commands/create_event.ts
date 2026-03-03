import { CommandHandler } from "./abstract.ts";

export class CreateEvent extends CommandHandler {
  public override run(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
