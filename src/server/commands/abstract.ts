import { Handler, LSPAny } from "../methods/message.types.ts";

/**
 * Workspace Commands
 */
export enum WorkspaceCommands {
  /**
   * Create a new event for an object
   */
  NEW_EVENT = "new_event",

  /**
   * Delete an event for an object
   */
  DELETE_EVENT = "delete_event",
}

/**
 * @class CommandHandler is a way to run a command based on the params and command type
 */
export abstract class CommandHandler implements Handler {
  /**
   * The arguments provided by the client
   */
  protected args: LSPAny[] = [];

  /**
   * The command that was sent back
   */
  protected command: WorkspaceCommands = WorkspaceCommands.NEW_EVENT;

  /**
   * Create a new command handler given the command type and the arguments
   * @param command The command type to use
   * @param args The arguments to use for the command
   */
  constructor(command: WorkspaceCommands, args: LSPAny[] = []) {
    this.command = command;
    this.args = args;
  }

  /**
   * Handler for running a command
   */
  public abstract handle(): Promise<void> | void;
}
