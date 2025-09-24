import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

const execAsync = promisify(exec);

export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));

  try {
    const { stdout, stderr } = await execAsync(command, { cwd: ctx.outputDir });
    if (stderr) {
      console.error(chalk.red(`[CMD-ERROR] ${stderr}`));
    }
    if (stdout) {
      console.log(stdout);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`[CMD-EXEC-ERROR] ${error.message}`));
    } else {
      console.error(chalk.red(`[CMD-EXEC-ERROR] ${String(error)}`));
    }
  }
}