import * as fs from "fs/promises";
import { AstNode } from "./types.js";
import { CommandContext, CommandResult } from "./types.js";
import { parseContent } from "../parser.js";

export async function handleImport(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    const importPath = ctx.context.interpolate(node.payload);
    const resolvedPath = ctx.resolvePath(importPath);

    const content = await fs.readFile(resolvedPath, "utf-8");
    const parseResult = parseContent(content);

    // Execute the imported script
    await ctx.executeNodes(parseResult.ast);

    return {
      success: `Script imported and executed: ${importPath}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
