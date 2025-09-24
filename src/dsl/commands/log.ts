import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleLog(node: AstNode, ctx: CommandContext): Promise<void> {
  const message = ctx.context.interpolate(node.payload);
  console.log(chalk.blue(`[LOG] ${message}`));
}