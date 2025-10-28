import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext, CommandResult } from "./types.js";

export async function handleForeach(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  if (node.type !== '@LOOP') {
    throw new Error(`Expected @LOOP node, got ${node.type}`);
  }

  // Parse: @loop item in arrayVariable
  const parts = node.payload.trim().split(/\s+/);
  if (parts.length !== 3 || parts[1] !== 'in') {
    throw new Error(`Invalid @loop syntax. Expected: @loop item in arrayVariable`);
  }

  const [itemName, , listVar] = parts;
  const list = ctx.context.get(listVar);

  if (!Array.isArray(list)) {
    throw new Error(`Variable "${listVar}" is not an array for @loop command.`);
  }

  for (const item of list) {
    ctx.context.set(itemName, item);
    await ctx.execute(node.children || []);
  }
  return {
    silent: true // for each commands don't need success messages
  }
}