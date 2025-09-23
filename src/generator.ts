#!/usr/bin/env node

// Entrypoint for the CLI
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'node:fs/promises';
import * as path from 'path';

import { Context } from "./dsl/context.js";
import { parseContent } from "./dsl/parser.js";
import { Executor } from "./dsl/executor.js";
import { loadFolderAsObject } from './dsl/parseFolder.js';

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
  .option('output', {
    type: 'string',
    description: 'The output directory to execute the script in',
    default: '.',
  })
  .option('parse', {
    type: 'string',
    description: 'Parse a folder and return a json representation of the folder'
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const genFile = argv.file;
const configFile = argv.config;
const parsedFolder = argv.parse;

// If --parse is provided, parse the folder and output to template.json
if (parsedFolder) {
 const folderContent = await loadFolderAsObject(parsedFolder, ['node_modules', 'dist', '.txt', '.git']);
  await fs.writeFile(path.join(process.cwd(), 'template.json'), JSON.stringify(folderContent, null, 2), 'utf-8');
  console.log("\nTemplate folder parsed correctly. Output written to template.json");
  process.exit(0);
}

// overwise, run the generator
const outputDir = argv.output ? path.resolve(argv.output) : process.cwd();

console.log(`Using .gen file: ${genFile}`);
if (configFile) {
  console.log(`Using config file: ${configFile}`);
}
console.log(`Output directory: ${outputDir}`);

async function main() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error: Could not create output directory "${outputDir}".`);
    process.exit(1);
  }

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
  const executor = new Executor(context, outputDir);
  await executor.execute(ast);

  console.log("\nExecution completed.");
}

main();