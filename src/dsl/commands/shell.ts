import chalk from "chalk";
import { spawn } from "child_process";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import os from "os";

function getShellCommand(): { shell: string; args: string[] } {
  if (process.env.SHELL) {
    return { shell: process.env.SHELL, args: ["-i"] }; // interactive shell
  } else if (os.platform() === "win32") {
    return { shell: process.env.COMSPEC || "cmd.exe", args: ["/k"] }; // keep cmd open
  }
  return { shell: "/bin/sh", args: ["-i"] };
}

function initGlobalShell(ctx: CommandContext): void {
  if (ctx.globalShell.process) return; // Already initialized

  const { shell, args } = getShellCommand();
  console.log(chalk.gray(`[SHELL] Initializing global shell: ${shell}`));

  const shellProcess = spawn(shell, args, {
    cwd: ctx.outputDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  ctx.globalShell.process = shellProcess;
  ctx.globalShell.cwd = ctx.outputDir;

  // Handle shell errors
  shellProcess.on('error', (error) => {
    console.error(chalk.red(`[SHELL-ERROR] ${error.message}`));
  });

  shellProcess.on('exit', (code) => {
    console.log(chalk.yellow(`[SHELL] Global shell exited with code ${code}`));
    ctx.globalShell.process = undefined;
  });
}

export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));

  // Initialize global shell if needed
  initGlobalShell(ctx);

  const shellProcess = ctx.globalShell.process;
  if (!shellProcess || !shellProcess.stdin || !shellProcess.stdout || !shellProcess.stderr) {
    console.error(chalk.red('[SHELL-ERROR] Global shell not available'));
    return;
  }

  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';

    const onData = (data: Buffer) => {
      output += data.toString();
    };

    const onError = (data: Buffer) => {
      errorOutput += data.toString();
    };

    shellProcess.stdout!.on('data', onData);
    shellProcess.stderr!.on('data', onError);

    // Send command to shell
    shellProcess.stdin!.write(`${command}\n`);

    // Wait a bit for command to execute
    setTimeout(() => {
      shellProcess.stdout!.removeListener('data', onData);
      shellProcess.stderr!.removeListener('data', onError);

      if (errorOutput) {
        console.error(chalk.red(`[CMD-ERROR] ${errorOutput}`));
      }
      if (output) {
        console.log(output);
      }

      resolve();
    }, 100);
  });
}

// Helper function to cleanup global shell
export function cleanupGlobalShell(ctx: CommandContext): void {
  if (ctx.globalShell.process) {
    console.log(chalk.gray('[SHELL] Closing global shell'));
    ctx.globalShell.process.kill();
    ctx.globalShell.process = undefined;
  }
}