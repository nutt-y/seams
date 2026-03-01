import { AbstractHandler } from "../abstract.ts";

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
 * @class Execute custom commands
 */
export class Workspace_ExecuteCommand extends AbstractHandler {
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

  public override handle(): Promise<void> | void {
    throw new Error("Method not implemented.");
  }
}
