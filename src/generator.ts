#!/usr/bin/env node
// Entrypoint for the CLI
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'node:fs/promises';

import { Context } from "./dsl/context.js";
import { parseContent } from "./dsl/parser.js";
import { Executor } from "./dsl/executor.js";

console.log("Generator CLI");

const argv = yargs(hideBin(process.argv))
  .option('file', {
    type: 'string',
    description: 'Path to the .gen file',
    default: './test/project.gen',
  })
  .option('config', {
    type: 'string',
    description: 'Path to the JSON config file',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const genFile = argv.file;
const configFile = argv.config;

console.log(`Using .gen file: ${genFile}`);
if (configFile) {
  console.log(`Using config file: ${configFile}`);
}

async function main() {
  let initialContext = {};
  if (configFile) {
    try {
      const configContent = await fs.readFile(configFile, 'utf-8');
      initialContext = JSON.parse(configContent);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading or parsing config file: ${error.message}`);
      } else {
        console.error(`Error reading or parsing config file: ${String(error)}`);
      }
      process.exit(1);
    }
  }

  const context = new Context(initialContext);

  let genContent = "";
  try {
    genContent = await fs.readFile(genFile, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading .gen file: ${error.message}`);
    } else {
      console.error(`Error reading .gen file: ${String(error)}`);
    }
    process.exit(1);
  }

  const ast = parseContent(genContent);
  const executor = new Executor(context);
  await executor.execute(ast);

  console.log("\nExecution finished.");
}

main();
