import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleIf(node: AstNode, ctx: CommandContext): Promise<void> {
  if (await ctx.evaluateCondition(node.payload)) {
    await ctx.execute(node.children || []);
  }
}