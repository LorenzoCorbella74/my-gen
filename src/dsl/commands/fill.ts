import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleFill(node: AstNode, ctx: CommandContext): Promise<void> {
  const filePath = ctx.context.interpolate(node.payload.trim());
  
  if (!filePath) {
    throw new Error('Fill command requires a file path');
  }

  // The content should be stored in the node's content property
  const fillNode = node as any; // Cast to access content property
  if (!fillNode.content || fillNode.content.length === 0) {
    throw new Error('Fill command requires content between quote delimiters');
  }

  // Join content lines with newlines
  const content = fillNode.content.join('\n');

  const finalPath = ctx.resolvePath(filePath);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(finalPath);
  await fs.mkdir(dir, { recursive: true });

  // Write the content to the file
  await fs.writeFile(finalPath, content, 'utf-8');
  
  console.log(chalk.green(`[FILL] Content written to ${finalPath} (${content.length} characters)`));
}