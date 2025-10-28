import * as fs from "fs/promises";
import { AstNode, IfNode, ElseIfBlock, isIfNode } from "./types.js";
import { CommandContext, CommandResult } from "./types.js";

export async function handleIf(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
    try {
        if (!node.children) {
            return {error: 'IF block has no children to execute'};
        }

        const condition = ctx.context.interpolate(node.payload);

        if (await evaluateCondition(condition, ctx)) {
            await ctx.execute(node.children);
        } else if (isIfNode(node) && node.elseifBlocks) {
            // Check elseif conditions
            let executed = false;
            for (const elseifBlock of node.elseifBlocks) {
                const elseifCondition = ctx.context.interpolate(elseifBlock.condition);
                if (await evaluateCondition(elseifCondition, ctx)) {
                    await ctx.execute(elseifBlock.children);
                    executed = true;
                    break;
                }
            }

            // Execute else block if no elseif matched
            if (!executed && node.elseBlock) {
                await ctx.execute(node.elseBlock);
            }
        } else if (isIfNode(node) && node.elseBlock) {
            await ctx.execute(node.elseBlock);
        }

        return {
            silent: true // IF commands don't need success messages
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : String(error)
        };
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
    const trimmedCondition = condition.trim();

    // Handle "exists <file>" condition
    if (trimmedCondition.startsWith('exists ')) {
        const path = trimmedCondition.substring(7).trim();
        const interpolatedPath = ctx.context.interpolate(path);
        const finalPath = ctx.resolvePath(interpolatedPath);
        return await fileExists(finalPath);
    }

    // Handle "not_exists <file>" condition (for backward compatibility)
    if (trimmedCondition.startsWith('not_exists ')) {
        const path = trimmedCondition.substring(11).trim();
        const interpolatedPath = ctx.context.interpolate(path);
        const finalPath = ctx.resolvePath(interpolatedPath);
        return !(await fileExists(finalPath));
    }

    // Handle "<variable> is <value>" condition
    const isMatch = trimmedCondition.match(/^(\w+)\s+is\s+"(.*)"/);
    if (isMatch) {
        const [, varName, expectedValue] = isMatch;
        const actualValue = ctx.context.get(varName);
        const interpolatedExpected = ctx.context.interpolate(expectedValue);
        return String(actualValue) === interpolatedExpected;
    }

    // Handle "<variable> isnot <value>" condition
    const isnotMatch = trimmedCondition.match(/^(\w+)\s+isnot\s+"(.*)"/);
    if (isnotMatch) {
        const [, varName, expectedValue] = isnotMatch;
        const actualValue = ctx.context.get(varName);
        const interpolatedExpected = ctx.context.interpolate(expectedValue);
        return String(actualValue) !== interpolatedExpected;
    }

    // If no pattern matches, return false
    console.warn(`Unknown condition format: "${condition}"`);
    return false;
}