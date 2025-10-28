import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext, CommandResult } from "./types.js";

export async function handleLog(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  const message = ctx.context.interpolate(node.payload);
  
  // Log the message directly (this command handles its own output)
  console.log(chalk.blue(message));
  
  return {
    silent: true // Don't show additional spinner/success messages
  };
}