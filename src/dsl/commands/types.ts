import { Context } from "../context.js";
import { GlobalContext } from "../global.js";
import { ChildProcess } from "child_process";

// Union type for all possible AST nodes
export type AstNode =
  | LogNode
  | SetNode
  | GlobalNode
  | AiNode
  | ShellNode
  | WriteNode
  | IfNode
  | ForeachNode
  | FillNode
  | ImportNode
  | TaskNode;

// Type guards for runtime type checking
export const isLogNode = (node: AstNode): node is LogNode => node.type === '@LOG';
export const isSetNode = (node: AstNode): node is SetNode => node.type === '@SET';
export const isGlobalNode = (node: AstNode): node is GlobalNode => node.type === '@GLOBAL';
export const isAiNode = (node: AstNode): node is AiNode => node.type === '@AI';
export const isShellNode = (node: AstNode): node is ShellNode => node.type === '>';
export const isWriteNode = (node: AstNode): node is WriteNode => node.type === '@WRITE' || node.type === '@SAVE';
export const isIfNode = (node: AstNode): node is IfNode => node.type === '@IF';
export const isForeachNode = (node: AstNode): node is ForeachNode => node.type === '@LOOP';
export const isFillNode = (node: AstNode): node is FillNode => node.type === '@FILL';
export const isImportNode = (node: AstNode): node is ImportNode => node.type === '@IMPORT';
export const isTaskNode = (node: AstNode): node is TaskNode => node.type === '@TASK';

// Helper type for block commands that have children
export type BlockNode = IfNode | ForeachNode | TaskNode;

export interface GlobalShell {
    process?: ChildProcess; // Kept for backward compatibility but not used in deterministic approach
    cwd: string;
}

export interface CommandContext {
    context: Context;
    outputDir: string;
    globalContext: GlobalContext;
    globalShell: GlobalShell;
    resolvePath: (p: string) => string;
    execute: (nodes: AstNode[]) => Promise<void>;
    executeNodes: (nodes: AstNode[]) => Promise<void>;
}

// New result type for command handlers
export interface CommandResult {
  success?: string | any;  // Success message or data returned
  error?: string;         // Error message
  silent?: boolean;       // Flag to suppress spinner/log display
}

export type CommandHandler = (node: AstNode, ctx: CommandContext) => Promise<CommandResult>;

// Base type for all AST nodes
export interface BaseAstNode {
  line: number;
  children?: AstNode[];
}

// Specific node types for each command
export interface LogNode extends BaseAstNode {
  type: '@LOG';
  payload: string; // The message to log
}

export interface SetNode extends BaseAstNode {
  type: '@SET';
  payload: string; // The assignment expression (e.g., "name = value")
}

export interface GlobalNode extends BaseAstNode {
  type: '@GLOBAL';
  payload: string; // The assignment expression (e.g., "name = value") - saved to .global.json
}

export interface AiNode extends BaseAstNode {
  type: '@AI';
  payload: string; // The AI prompt to send to Ollama
}

export interface ShellNode extends BaseAstNode {
  type: '>';
  payload: string; // The shell command to execute
}

export interface WriteNode extends BaseAstNode {
  type: '@WRITE' | '@SAVE';
  payload: string; // The write expression (e.g., '"content" to path' or 'variable to path')
}

export interface IfNode extends BaseAstNode {
  type: '@IF';
  payload: string; // The condition (e.g., "exists path", "var is value", "var isnot value")
  children: AstNode[]; // Always has children for IF blocks
  elseifBlocks?: ElseIfBlock[]; // Optional elseif blocks
  elseBlock?: AstNode[]; // Optional else block
}

export interface ElseIfBlock {
  condition: string; // The elseif condition
  children: AstNode[]; // Commands to execute if condition is true
  line: number; // Line number for error reporting
}

export interface ForeachNode extends BaseAstNode {
  type: '@LOOP';
  payload: string; // The iteration expression (e.g., "item in listVar")
  children: AstNode[]; // Always has children for LOOP blocks
}

export interface FillNode extends BaseAstNode {
  type: '@FILL';
  payload: string; // The file path to write to
  content?: string[]; // Array containing the content lines
}

export interface ImportNode extends BaseAstNode {
  type: '@IMPORT';
  payload: string; // The file path to import
}

export interface TaskNode extends BaseAstNode {
  type: '@TASK';
  payload: string; // The task name
  children: AstNode[]; // Commands to execute for this task
}

// Metadata interface for Front Matter
export interface Metadata {
  author?: string;
  version?: string;
  description?: string;
  tags?: string[];
  requires?: string[];
  links?: string[];
}

// Result type for parsing, includes metadata and AST
export interface ParseResult {
  metadata: Metadata;
  ast: AstNode[];
}

