import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleForeach(node: AstNode, ctx: CommandContext): Promise<void> {
  const [itemName, , listVar] = node.payload.split(/\s+/);
  const list = ctx.context.get(listVar);

  if (!Array.isArray(list)) {
    console.error(chalk.red(`[FOREACH-ERROR] Variable "${listVar}" is not an array.`));
    return;
  }

  for (const item of list) {
    ctx.context.set(itemName, item);
    await ctx.execute(node.children || []);
  }
}