import * as fs from "fs/promises";
import chalk from "chalk";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import { parseContent } from "../parser.js";

export async function handleImport(node: AstNode, ctx: CommandContext): Promise<void> {
  const importPath = ctx.context.interpolate(node.payload.trim());
  if (!importPath) {
    throw new Error("@import requires a file path");
  }
  try {
    const fileContent = await fs.readFile(importPath, "utf-8");
    const importedAst = parseContent(fileContent);
    await ctx.execute(importedAst);
    console.log(chalk.green(`[IMPORT] Imported and executed commands from ${importPath}`));
  } catch (error) {
    throw new Error(`Failed to import ${importPath}: ${error}`);
  }
}
