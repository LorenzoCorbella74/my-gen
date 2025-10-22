import { AstNode } from "../parser.js";
import { Context } from "../context.js";
import { GlobalContext } from "../global.js";
import { ChildProcess } from "child_process";

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

export type CommandHandler = (node: AstNode, ctx: CommandContext) => Promise<void>;