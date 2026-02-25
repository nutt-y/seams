import { parseArgs } from "@std/cli/parse-args";
import { CLIFlags, runProgram } from "./src/cli/flags.ts";

/**
 * Main process
 */
const main = async () => {
  // Get flags
  const flags = parseArgs(Deno.args, {
    boolean: [CLIFlags.HELP, CLIFlags.STDIO],
    string: [CLIFlags.DEBUG],
    default: {
      debug: false,
      help: false,
    },
  });

  // Start the program based on the attributes given
  const program = runProgram(
    flags as unknown as Parameters<typeof runProgram>[0],
  );

  await program.run();
};

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main();
}
