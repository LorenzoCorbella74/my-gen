import { AstNode, CommandContext, CommandResult } from "./types.js";

export async function handleTask(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    if (!node.children || node.children.length === 0) {
      return {
        error: 'TASK block has no children to execute'
      };
    }

    // Execute all child commands in the task
    await ctx.executeNodes(node.children);

    return {
      silent: true // TASK commands don't need success messages (handled by individual commands)
    };
    
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}