import chalk from "chalk";
import { AstNode, CommandContext, CommandResult } from "./types.js";

export async function handleForeach(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    if (!node.children) {
      return {
        error: 'LOOP block has no children to execute'
      };
    }

    const payload = ctx.context.interpolate(node.payload);
    const match = payload.match(/^(\w+)\s+in\s+(.+)$/);
    
    if (!match) {
      return {
        error: 'Invalid LOOP syntax. Expected: item in arrayVariable'
      };
    }

    const [, itemVar, arrayVar] = match;
    const arrayValue = ctx.context.get(arrayVar.trim());
    
    if (arrayValue === undefined) {
      return {
        error: `Variable "${arrayVar.trim()}" is not defined`
      };
    }

    let items: string[];
    if (Array.isArray(arrayValue)) {
      items = arrayValue;
    } else if (typeof arrayValue === 'string') {
      items = arrayValue.split(',').map(item => item.trim());
    } else {
      return {
        error: `Variable "${arrayVar.trim()}" is not an array or comma-separated string`
      };
    }

    for (const item of items) {
      ctx.context.set(itemVar.trim(), item);
      await ctx.executeNodes(node.children);
    }

    return {
      silent: true // LOOP commands don't need success messages
    };
    
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}