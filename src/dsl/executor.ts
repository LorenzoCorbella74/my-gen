// Command Executor
// This file will contain the logic to execute the AST nodes.

import process from "node:process";
import * as path from "path";
import { AstNode, isTaskNode, Metadata, ParseResult } from "../dsl/commands/types.js";
import { Context } from "./context.js";
import { GlobalContext } from "./global.js";
import { promptSelect } from "../utils/prompts.js";
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
  type CommandResult,
  type CommandContext,
  type GlobalShell,
  type CommandHandler
} from "./commands/index.js";

export class Executor {
  private context: Context;
  private commands: Map<string, CommandHandler> = new Map();
  private outputDir: string;
  private globalContext: GlobalContext;
  private globalShell: GlobalShell;

  constructor(context: Context, outputDir: string) {
    this.context = context;
    this.outputDir = outputDir;
    this.globalContext = new GlobalContext();
    this.globalShell = { cwd: outputDir };
    // Expose the output dir to templates (forward slashes for cross-platform paths).
    this.context.set('OUTPUT_DIR', outputDir.replace(/\\/g, '/'));
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
    // Use globalShell.cwd instead of outputDir to respect current directory changes from shell commands
    const basePath = this.globalShell.cwd || this.outputDir;
    return path.resolve(basePath, p);
  }

  private registerCommands() {
    this.commands.set("@LOG", handleLog);
    this.commands.set("@SET", handleSet);
    this.commands.set("@GLOBAL", handleGlobal);
    this.commands.set("@AI", handleAiCommand);
    this.commands.set(">", handleShell);
    this.commands.set("@WRITE", handleWrite);
    this.commands.set("@SAVE", handleWrite);
    this.commands.set("@FILL", handleFill);
    this.commands.set("@IF", handleIf);
    this.commands.set("@LOOP", handleForeach);
    this.commands.set("@IMPORT", handleImport);
    this.commands.set("@TASK", handleTask);
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

  /**
   * Log metadata information at the start of execution
   */
  private logMetadata(metadata: Metadata): void {
    if (Object.keys(metadata).length === 0) return;

    console.log('\n📋 Script Metadata:');

    if (metadata.description) {
      console.log(`   Description: ${metadata.description}`);
    }

    if (metadata.author) {
      console.log(`   Author: ${metadata.author}`);
    }

    if (metadata.version) {
      console.log(`   Version: ${metadata.version}`);
    }

    if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      console.log(`   Tags: ${metadata.tags.join(', ')}`);
    }

    if (metadata.requires && Array.isArray(metadata.requires) && metadata.requires.length > 0) {
      console.log(`   Requires: ${metadata.requires.join(', ')}`);
    }

    if (metadata.links && Array.isArray(metadata.links) && metadata.links.length > 0) {
      console.log(`   Links: ${metadata.links.join(', ')}`);
    }

    console.log(''); // Empty line for spacing
  }

  public async execute(parseResult: ParseResult | AstNode[]): Promise<void> {
    let nodes: AstNode[];
    let metadata: Metadata = {};

    // Handle both old and new formats for backward compatibility
    if (Array.isArray(parseResult)) {
      nodes = parseResult;
    } else {
      nodes = parseResult.ast;
      metadata = parseResult.metadata;
      this.logMetadata(metadata);
    }

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
    console.log(`Found ${tasks.length} task(s) in the file.`);
    const selectedTask = await promptSelect(
      "Which task would you like to execute?",
      tasks.map((task) => ({ name: task.name, value: task.node })),
    );
    console.log(`Executing task: ${selectedTask.payload}`);
    await this.executeNodes([selectedTask]);
  }

  /**
   * Execute a list of nodes with centralized logging and spinner management
   */
  public async executeNodes(nodes: AstNode[]): Promise<void> {
    const ctx = this.createCommandContext();

    for (const node of nodes) {
      const commandFn = this.commands.get(node.type.toUpperCase());

      if (commandFn) {
        try {
          const result: CommandResult = await commandFn(node, ctx);

          // Handle error result
          if (result.error) {
            console.error(`Error executing ${node.type} at line ${node.line}: ${result.error}`);
            process.exit(1);
          }

        } catch (error) {
          // Handle unexpected errors (fallback)
          let errorMessage = `Error executing ${node.type} command at line ${node.line}`;

          if (error && typeof error === "object" && "message" in error) {
            const originalMessage = (error as { message: string }).message;
            const cleanMessage = originalMessage
              .replace(/^\[.*?\]\s*/, '')
              .replace(/^Error:\s*/, '')
              .trim();
            errorMessage += `: ${cleanMessage}`;
          } else {
            errorMessage += `: ${String(error)}`;
          }

          console.error(errorMessage);
          process.exit(1);
        }
      } else {
        console.error(`Unknown command "${node.type}" at line ${node.line}`);
        process.exit(1);
      }
    }
  }
}
