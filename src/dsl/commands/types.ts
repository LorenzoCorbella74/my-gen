import { AstNode } from "../parser.js";
import { Context } from "../context.js";
import { GlobalContext } from "../global.js";

export interface CommandContext {
    context: Context;
    outputDir: string;
    globalContext: GlobalContext;
    resolvePath: (p: string) => string;
    execute: (nodes: AstNode[]) => Promise<void>;
}

export type CommandHandler = (node: AstNode, ctx: CommandContext) => Promise<void>;