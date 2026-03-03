import { AbstractHandler } from "../abstract.ts";
import {
  type CommandHandler,
  WorkspaceCommands,
} from "../commands/abstract.ts";
import { CreateEvent } from "../commands/create_event.ts";
import type { LSPAny, WorkDoneProgressParams } from "./message.types.ts";

type Params = WorkDoneProgressParams & {
  /**
   * The identifier of the actual command handler
   */
  command: string;

  /**
   * Argumnets that the command should be invoked with
   */
  args?: LSPAny[];
};

/**
 * The response can be anything
 */
type Response = unknown;

/**
 * @class Execute custom commands
 */
export class Workspace_ExecuteCommand extends AbstractHandler {
  // The handlers for each command handler that we have access to
  private static HANDLERS: {
    [T in WorkspaceCommands]: new (
      ...input: ConstructorParameters<typeof CommandHandler>
    ) => CommandHandler;
  } = {
    [WorkspaceCommands.NEW_EVENT]: CreateEvent,
    [WorkspaceCommands.DELETE_EVENT]: {} as any,
  };

  /**
   * Get custom workspace command names
   * @returns The commands that is available in lsp
   */
  public static GetWorkspaceCommands(): string[] {
    const commands = Object.entries(WorkspaceCommands).reduce(
      (acc: string[], [_, value]) => {
        acc.push(value);

        return acc;
      },
      [],
    );

    return commands;
  }

  /**
   * Given the command as a string, return the key in the enum for that command
   */
  public static GetWorkSpaceCommandKey(
    command: string,
  ): keyof typeof WorkspaceCommands | null {
    // Get a reverse dict with the enum values as keys and the enum members as values
    const keys = Object.entries(WorkspaceCommands).reduce(
      (
        acc: Map<WorkspaceCommands, keyof typeof WorkspaceCommands>,
        [key, value],
      ) => {
        acc.set(value, key as keyof typeof WorkspaceCommands);

        return acc;
      },
      new Map<WorkspaceCommands, keyof typeof WorkspaceCommands>(),
    );

    // Get the key for the workspace command
    const key = keys.get(command as unknown as WorkspaceCommands) ?? null;

    return key;
  }

  /**
   * Handle the commands that the client wants to run
   */
  public override async handle(): Promise<void> {
    const { params } = this.message;
    const { command, args } = params as unknown as Params;
    const key = this.getCommandType(command);

    const handlerClass = Workspace_ExecuteCommand.HANDLERS[key];
    const handler = new handlerClass(key, args, this.project, this.logger);

    // Get the result from running the command
    const result = await handler.run();
  }

  /**
   * Get the command enum type give, the enum value as a string
   * @param command The command that is being used
   */
  protected getCommandType(command: string): WorkspaceCommands {
    const key = WorkspaceCommands[command as keyof typeof WorkspaceCommands];

    return key ?? WorkspaceCommands.NEW_EVENT;
  }
}
