import { HelpProgram, LspProgram, type Program } from "./program.ts";

/**
 * Cli flags for the program
 */
export enum CLIFlags {
  DEBUG = "debug",
  HELP = "help",
  STDIO = "stdio",
}

/**
 * Get the results of the flag and use that for the following
 * @param flags The flags that can be used for the program
 * @returns The program to run based on the flags provided
 */
export const runProgram = (flags: Record<CLIFlags, unknown>) => {
  let program: Program = new LspProgram();

  // Get the flag positions
  Object.entries(flags).forEach(([key, value]) => {
    switch (key) {
      case CLIFlags.HELP:
        program = new HelpProgram();
        return;

      case CLIFlags.DEBUG:
        (program as LspProgram).log = value as string;
        break;
    }
  });

  return program;
};
