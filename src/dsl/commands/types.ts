import { AstNode } from "../parser.js";
import { Context } from "../context.js";
import { GlobalContext } from "../global.js";
import { ChildProcess } from "child_process";

export interface GlobalShell {
    process?: ChildProcess;
    cwd: string;
}

export interface CommandContext {
    context: Context;
    outputDir: string;
    globalContext: GlobalContext;
    globalShell: GlobalShell;
    resolvePath: (p: string) => string;
    execute: (nodes: AstNode[]) => Promise<void>;
}

export type CommandHandler = (node: AstNode, ctx: CommandContext) => Promise<void>;