// Entrypoint for the CLI
import { parseArgs } from "@std/cli/parse-args";

import { Context } from "./dsl/context.ts";
import { parseContent } from "./dsl/parser.ts";
import { Executor } from "./dsl/executor.ts";

console.log("Generator CLI");

// https://docs.deno.com/examples/command_line_arguments/
const flags = parseArgs(Deno.args,{
  string: ["file","config"],
  default: { file: "./test/project.gen" },
  negatable: ["color"],
})

const genFile = flags.file;
const configFile = flags.config;

console.log(`Using .gen file: ${genFile}`);
if (configFile) {
  console.log(`Using config file: ${configFile}`);
}

async function main() {
  let initialContext = {};
  if (configFile) {
    try {
      const configContent = await Deno.readTextFile(configFile);
      initialContext = JSON.parse(configContent);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading or parsing config file: ${error.message}`);
      } else {
        console.error(`Error reading or parsing config file: ${String(error)}`);
      }
      Deno.exit(1);
    }
  }

  const context = new Context(initialContext);

  let genContent = "";
  try {
    genContent = await Deno.readTextFile(genFile);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading .gen file: ${error.message}`);
    } else {
      console.error(`Error reading .gen file: ${String(error)}`);
    }
    Deno.exit(1);
  }

  const ast = parseContent(genContent);
  const executor = new Executor(context);
  await executor.execute(ast);

  console.log("\nExecution finished.");
}

main();
