import type winston from "winston";
import type GMLProject from "../../parser/project.ts";
import type { LSPAny } from "../methods/message.types.ts";

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
export abstract class CommandHandler {
  /**
   * The arguments provided by the client
   */
  protected args: LSPAny[] = [];

  /**
   * The command that was sent back
   */
  protected command: WorkspaceCommands = WorkspaceCommands.NEW_EVENT;

  /**
   * The gml project to use
   */
  protected project: GMLProject;

  /**
   * The logger to utilize as well
   */
  protected logger: winston.Logger;

  /**
   * Create a new command handler given the command type and the arguments
   * @param command The command type to use
   * @param args The arguments to use for the command
   * @param project The gml project to use
   * @param logger The logger to use
   */
  constructor(
    command: WorkspaceCommands,
    args: LSPAny[] = [],
    project: GMLProject,
    logger: winston.Logger,
  ) {
    this.command = command;
    this.args = args;
    this.project = project;
    this.logger = logger;
  }

  /**
   * Handler for running a command
   * @returns The result to return back to the client
   */
  public abstract run(): Promise<unknown>;
}
