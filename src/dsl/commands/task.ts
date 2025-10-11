import { AstNode, isTaskNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleTask(node: AstNode, ctx: CommandContext): Promise<void> {
  if (!isTaskNode(node)) {
    throw new Error("Invalid node type for task handler");
  }
  
  // When a task is executed, we run all its children commands
  await ctx.executeNodes(node.children);
}