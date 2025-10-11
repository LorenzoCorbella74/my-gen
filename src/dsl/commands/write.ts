import chalk from "chalk";
import * as fs from "fs/promises";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleWrite(node: AstNode, ctx: CommandContext): Promise<void> {
  const payload = node.payload;
  const match = payload.match(/^(?:("(.+?)")|(\w+))\s+to\s+(.+)$/);

  if (!match) {
    throw new Error(`Invalid syntax. Use: WRITE \"<content>\" to <path> OR WRITE <variable> to <path>`);
  }

  const [, , literalContent, variableName, filePath] = match;

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
    const finalPath = ctx.resolvePath(ctx.context.interpolate(filePath));
    console.log('Saving to :', finalPath);
    // if the path is not present create it
    await fs.mkdir(ctx.resolvePath(ctx.context.interpolate(filePath)).replace(/\/[^\/]+$/, ''), { recursive: true });
    // write the file
    await fs.writeFile(finalPath, String(contentToWrite));
    console.log(chalk.green(`[WRITE] Content written to ${finalPath}`));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write content: ${error.message}`);
    }
    throw error;
  }
}