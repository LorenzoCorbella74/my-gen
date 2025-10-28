import { input, } from '@inquirer/prompts';
import { AstNode } from "../parser.js";
import { CommandContext, CommandResult } from "./types.js";

export async function handleGlobal(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
    try {
        const assignment = ctx.context.interpolate(node.payload);
        const [varName, ...valueParts] = assignment.split('=').map(s => s.trim());
        
        if (!varName || valueParts.length === 0) {
            return {
                error: "Invalid assignment syntax. Expected: variable = value"
            };
        }

        const value = valueParts.join('=').trim();

        if (value.startsWith('@input ')) {
            const prompt = value.substring(7);
            const userInput = await input({ message: prompt });
            ctx.context.set(varName, userInput);
            await ctx.globalContext.set(varName, userInput);
        } else {
            // Handle other value types similar to handleSet
            const cleanValue = value.replace(/^["']|["']$/g, '');
            ctx.context.set(varName, cleanValue);
            await ctx.globalContext.set(varName, cleanValue);
        }

        return {
            silent: true // Global variable assignments don't need success messages
        };
        
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : String(error)
        };
    }
}