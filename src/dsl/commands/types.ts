import { AstNode } from "../parser.js";
import { Context } from "../context.js";
import { GlobalVariablesManager } from "../global.js";

export interface CommandContext {
  context: Context;
  outputDir: string;
  globalManager: GlobalVariablesManager;
  resolvePath: (p: string) => string;
  fileExists: (path: string) => Promise<boolean>;
  evaluateCondition: (condition: string) => Promise<boolean>;
  execute: (nodes: AstNode[]) => Promise<void>;
}

export type CommandHandler = (node: AstNode, ctx: CommandContext) => Promise<void>;