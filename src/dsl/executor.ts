// Command Executor
// This file will contain the logic to execute the AST nodes.


import process from "node:process";
import chalk from "chalk";
import * as path from "path";
import { AstNode } from "./parser.js";
import { Context } from "./context.js";
import { GlobalContext } from "./global.js";
import { SimpleSpinner } from "../utils/spinner.js";
import {
  handleLog,
  handleSet,
  handleGlobal,
  handleAiCommand,
  handleShell,
  handleWrite,
  handleCompile,
  handleFill,
  handleIf,
  handleForeach,
  type CommandHandler,
  type CommandContext
} from "./commands/index.js";

export class Executor {
  private context: Context;
  private commands: Map<string, (node: AstNode) => Promise<void>> = new Map();
  private outputDir: string;
  private globalContext: GlobalContext;

  constructor(context: Context, outputDir: string) {
    this.context = context;
    this.outputDir = outputDir;
    this.globalContext = new GlobalContext();
    this.registerCommands();
    // Initialize global variables automatically
    this.initializeGlobalVariables();
  }

  /**
   * Initialize global variables by loading them into the current context
   * Called automatically during constructor
   */
  private async initializeGlobalVariables(): Promise<void> {
    await this.globalContext.initializeGlobalVariables(this.context);
  }

  private resolvePath(p: string): string {
    if (path.isAbsolute(p)) {
      return p;
    }
    return path.resolve(this.outputDir, p);
  }

  private registerCommands() {
    const ctx = this.createCommandContext();
    
    this.commands.set("@LOG", (node: AstNode) => handleLog(node, ctx));
    this.commands.set("@SET", (node: AstNode) => handleSet(node, ctx));
    this.commands.set("@GLOBAL", (node: AstNode) => handleGlobal(node, ctx));
    this.commands.set("@AI", (node: AstNode) => handleAiCommand(node, ctx));
    this.commands.set(">", (node: AstNode) => handleShell(node, ctx));
    this.commands.set("@WRITE", (node: AstNode) => handleWrite(node, ctx));
    this.commands.set("@SAVE", (node: AstNode) => handleWrite(node, ctx)); // Alias
    this.commands.set("@FILL", (node: AstNode) => handleFill(node, ctx));
    this.commands.set("IF", (node: AstNode) => handleIf(node, ctx));
    this.commands.set("FOREACH", (node: AstNode) => handleForeach(node, ctx));
    this.commands.set("COMPILE", (node: AstNode) => handleCompile(node, ctx));
  }

  private createCommandContext(): CommandContext {
    return {
      context: this.context,
      outputDir: this.outputDir,
      globalContext: this.globalContext,
      resolvePath: this.resolvePath.bind(this),
      execute: this.execute.bind(this)
    };
  }

  public async execute(nodes: AstNode[]) {
    for (const node of nodes) {
      const commandFn = this.commands.get(node.type.toUpperCase());
      if (commandFn) {
        let spinner
        // Create spinner with command info
        if (node.type !== "@SET" && node.type !== "@LOG" && node.type !== "@GLOBAL") {
          spinner = new SimpleSpinner(`Executing ${node.type} at line ${node.line}`).start();
        }
        try {
          await commandFn(node);
          spinner && spinner.succeed(`${node.type} completed`);
        } catch (error) {
          spinner && spinner.fail(`${node.type} failed`);
          if (error && typeof error === "object" && "message" in error) {
            console.error(chalk.red(`Error executing command at line ${node.line}: ${(error as { message: string }).message}`));
          } else {
            console.error(chalk.red(`Error executing command at line ${node.line}: ${String(error)}`));
          }
          process.exit(1);
        }
      } else {
        console.error(chalk.red(`Unknown command "${node.type}" at line ${node.line}`));
        process.exit(1);
      }
    }
  }
}
