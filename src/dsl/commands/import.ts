import * as fs from "fs/promises";
import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import { parseContent } from "../parser.js";

export async function handleImport(node: AstNode, ctx: CommandContext): Promise<void> {
  const importPath = ctx.context.interpolate(node.payload);
  const resolvedPath = ctx.resolvePath(importPath);

  console.log(chalk.gray(`[IMPORT] Loading script from ${resolvedPath}`));

  try {
    const content = await fs.readFile(resolvedPath, "utf-8");
    const parseResult = parseContent(content);

    // Log metadata if present in imported file
    if (parseResult.metadata && Object.keys(parseResult.metadata).length > 0) {
      console.log(chalk.cyan(`[IMPORT] Script metadata: ${parseResult.metadata.description || "No description"}`));
    }

    await ctx.executeNodes(parseResult.ast);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import script: ${error.message}`);
    } else {
      throw new Error(`Failed to import script: ${String(error)}`);
    }
  }
}
