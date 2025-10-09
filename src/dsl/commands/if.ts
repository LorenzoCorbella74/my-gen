import * as fs from "fs/promises";
import { AstNode, IfNode, ElseIfBlock } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleIf(node: AstNode, ctx: CommandContext): Promise<void> {
    if (node.type !== '@IF') {
        throw new Error(`Expected @IF node, got ${node.type}`);
    }
    
    const ifNode = node as IfNode;
    
    // Evaluate main if condition
    if (await evaluateCondition(ifNode.payload, ctx)) {
        await ctx.execute(ifNode.children || []);
        return;
    }
    
    // Evaluate elseif conditions
    if (ifNode.elseifBlocks) {
        for (const elseifBlock of ifNode.elseifBlocks) {
            if (await evaluateCondition(elseifBlock.condition, ctx)) {
                await ctx.execute(elseifBlock.children);
                return;
            }
        }
    }
    
    // Execute else block if present
    if (ifNode.elseBlock) {
        await ctx.execute(ifNode.elseBlock);
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