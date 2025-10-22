import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleWrite(node: AstNode, ctx: CommandContext): Promise<void> {
  const payload = node.payload;
  const match = payload.match(/^(?:("(.+?)")|(\w+))\s+to\s+(.+)$/);

  if (!match) {
    throw new Error(`Invalid syntax. Use: WRITE \"<content>\" to <path> OR WRITE <variable> to <path>`);
  }

  const [, , literalContent, variableName, filePath] = match;
  const interpolatedPath = ctx.resolvePath(ctx.context.interpolate(filePath));

  let contentToWrite: string;
  if (literalContent) {
    contentToWrite = ctx.context.interpolate(literalContent);
  } else if (variableName) {
    contentToWrite = ctx.context.get(variableName);
    if (contentToWrite === undefined) {
      throw new Error(`Variable "${variableName}" is not defined.`);
    }
  } else {
    throw new Error(`Invalid content specified.`);
  }

  try {
    // Resolve path relative to global shell's current working directory
    const finalPath = path.isAbsolute(interpolatedPath)
      ? interpolatedPath
      : path.resolve(ctx.globalShell.pwd, interpolatedPath);


    // Create directory if it doesn't exist
    const dir = path.dirname(finalPath);
    await fs.mkdir(dir, { recursive: true });
    // Write the content to the file
    await fs.writeFile(finalPath, String(contentToWrite), 'utf-8');

    console.log(chalk.green(`[WRITE] Content written to ${finalPath}`));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write content: ${error.message}`);
    }
    throw error;
  }
}