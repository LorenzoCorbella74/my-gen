// Command Executor
// This file will contain the logic to execute the AST nodes.


import process from "node:process";
import chalk from "chalk";
import * as path from "path";
import { select } from '@inquirer/prompts';
import { AstNode, isTaskNode } from "./parser.js";
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
  handleFill,
  handleIf,
  handleForeach,
  handleImport,
  handleTask,
  cleanupGlobalShell,
  type CommandHandler,
  type CommandContext,
  type GlobalShell
} from "./commands/index.js";

export class Executor {
  private context: Context;
  private commands: Map<string, (node: AstNode) => Promise<void>> = new Map();
  private outputDir: string;
  private globalContext: GlobalContext;
  private globalShell: GlobalShell;

  constructor(context: Context, outputDir: string) {
    this.context = context;
    this.outputDir = outputDir;
    this.globalContext = new GlobalContext();
    this.globalShell = { cwd: outputDir };
    this.registerCommands();
    // Note: initializeGlobalVariables will be called explicitly before execute
  }

  /**
   * Initialize global variables by loading them into the current context
   * Must be called before execute
   */
  public async initializeGlobalVariables(): Promise<void> {
    await this.globalContext.initializeGlobalVariables(this.context);
  }

  private resolvePath(p: string): string {
    if (path.isAbsolute(p)) {
      return p;
    }
    // Use global shell's current working directory if available, fallback to outputDir
    const baseDir = this.globalShell.cwd || this.outputDir;

    return path.resolve(baseDir, p);
  }

  private registerCommands() {
    this.commands.set("@LOG", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleLog(node, ctx);
    });
    this.commands.set("@SET", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleSet(node, ctx);
    });
    this.commands.set("@GLOBAL", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleGlobal(node, ctx);
    });
    this.commands.set("@AI", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleAiCommand(node, ctx);
    });
    this.commands.set(">", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleShell(node, ctx);
    });
    this.commands.set("@WRITE", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleWrite(node, ctx);
    });
    this.commands.set("@SAVE", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleWrite(node, ctx);
    });
    this.commands.set("@FILL", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleFill(node, ctx);
    });
    this.commands.set("@IF", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleIf(node, ctx);
    });
    this.commands.set("@LOOP", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleForeach(node, ctx);
    });
    this.commands.set("FOREACH", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleForeach(node, ctx);
    }); // Backward compatibility
    this.commands.set("@IMPORT", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleImport(node, ctx);
    });
    this.commands.set("@TASK", async (node: AstNode) => {
      const ctx = this.createCommandContext();
      return handleTask(node, ctx);
    });
  }

  private createCommandContext(): CommandContext {
    return {
      context: this.context,
      outputDir: this.outputDir,
      globalContext: this.globalContext,
      globalShell: this.globalShell,
      resolvePath: this.resolvePath.bind(this),
      execute: this.execute.bind(this),
      executeNodes: this.executeNodes.bind(this)
    };
  }

  public async execute(nodes: AstNode[]) {
    // Check if there are any tasks in the nodes
    const tasks = this.findTasks(nodes);
    
    if (tasks.length > 0) {
      // If tasks are present, show selection menu
      await this.executeWithTaskSelection(tasks);
    } else {
      // Execute normally if no tasks
      await this.executeNodes(nodes);
    }
  }

  /**
   * Find all task nodes in the AST
   */
  private findTasks(nodes: AstNode[]): { name: string; node: AstNode }[] {
    const tasks: { name: string; node: AstNode }[] = [];

    for (const node of nodes) {
      if (isTaskNode(node)) {
        tasks.push({ name: node.payload, node });
      }
    }
    return tasks;
  }

  /**
   * Show task selection menu and execute chosen task
   */
  private async executeWithTaskSelection(tasks: { name: string; node: AstNode }[]): Promise<void> {
    console.log(chalk.yellow(`Found ${tasks.length} task(s) in the file.`));
    
    const choices = tasks.map(task => ({
      name: task.name,
      value: task.node
    }));
    
    const selectedTask = await select({
      message: 'Which task would you like to execute?',
      choices
    });
    
    console.log(chalk.blue(`Executing task: ${(selectedTask as any).payload}`));
    await this.executeNodes([selectedTask as AstNode]);
  }

  /**
   * Execute a list of nodes
   */
  private async executeNodes(nodes: AstNode[]) {
    for (const node of nodes) {
      const commandFn = this.commands.get(node.type.toUpperCase());
      if (commandFn) {
        let spinner
        // Create spinner with command info
        if (node.type !== "@SET" && node.type !== "@LOG" && node.type !== "@GLOBAL" && node.type !== "@IF" && node.type !== "@LOOP" && node.type !== "@TASK") {
          spinner = new SimpleSpinner(`Executing ${node.type} at line ${node.line} `).start();
        }
        try {
          await commandFn(node);
          spinner && spinner.succeed(`${node.type} completed`);
        } catch (error) {
          spinner && spinner.fail(`${node.type} failed`);
          
          // Centralized error handling with better formatting
          let errorMessage = `Error executing ${node.type} command at line ${node.line}`;
          
          if (error && typeof error === "object" && "message" in error) {
            const originalMessage = (error as { message: string }).message;
            // Remove redundant prefixes from error messages
            const cleanMessage = originalMessage
              .replace(/^\[.*?\]\s*/, '') // Remove [TAG] prefixes
              .replace(/^Error:\s*/, '') // Remove "Error:" prefix
              .trim();
            errorMessage += `: ${cleanMessage}`;
          } else {
            errorMessage += `: ${String(error)}`;
          }
          
          console.error(chalk.red(errorMessage));
          process.exit(1);
        }
      } else {
        console.error(chalk.red(`Unknown command "${node.type}" at line ${node.line}`));
        process.exit(1);
      }
    }
  }

  /**
   * Cleanup resources (like global shell) when executor is done
   */
  public cleanup(): void {
    cleanupGlobalShell(this.createCommandContext());
  }
}
