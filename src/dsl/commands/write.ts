import chalk from "chalk";
import * as fs from "fs/promises";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleWrite(node: AstNode, ctx: CommandContext): Promise<void> {
  const payload = node.payload;
  const match = payload.match(/^(?:("(.+?)")|(\w+))\s+to\s+(.+)$/);

  if (!match) {
    console.error(chalk.red(`[WRITE-ERROR] Invalid syntax. Use: WRITE \"<content>\" to <path> OR WRITE <variable> to <path>`));
    return;
  }

  const [, , literalContent, variableName, filePath] = match;

  let contentToWrite: string;
  if (literalContent) {
    contentToWrite = ctx.context.interpolate(literalContent);
  } else if (variableName) {
    contentToWrite = ctx.context.get(variableName);
    if (contentToWrite === undefined) {
      console.error(chalk.red(`[WRITE-ERROR] Variable "${variableName}" is not defined.`));
      return;
    }
  } else {
    console.error(chalk.red(`[WRITE-ERROR] Invalid content specified.`));
    return;
  }

  const finalPath = ctx.resolvePath(ctx.context.interpolate(filePath));
  console.log('Saving to :', finalPath);
  // if the path is not present create it
  await fs.mkdir(ctx.resolvePath(ctx.context.interpolate(filePath)).replace(/\/[^\/]+$/, ''), { recursive: true });
  // write the file
  await fs.writeFile(finalPath, String(contentToWrite));
  console.log(chalk.green(`[WRITE] Content written to ${finalPath}`));
}