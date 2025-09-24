import * as fs from "fs/promises";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleIf(node: AstNode, ctx: CommandContext): Promise<void> {
    if (await evaluateCondition(node.payload, ctx)) {
        await ctx.execute(node.children || []);
    }
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await fs.stat(path);
        return true;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

async function evaluateCondition(condition: string, ctx: CommandContext): Promise<boolean> {
    const [type, ...args] = condition.split(/\s+/);
    const p = ctx.context.interpolate(args.join(' '));
    const finalPath = ctx.resolvePath(p);

    if (type === 'exists') {
        return await fileExists(finalPath);
    } else if (type === 'not_exists') {
        return !(await fileExists(finalPath));
    }

    return false;
}