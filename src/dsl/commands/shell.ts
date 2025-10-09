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
    
    // Generate unique marker for this command
    const marker = `COMMAND_END_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine echo command based on platform
    const echoCommand = os.platform() === "win32" 
      ? `echo ${marker}` 
      : `echo "${marker}"`;

    const onData = (data: Buffer) => {
      const dataStr = data.toString();
      output += dataStr;
      
      // Check if marker is present in output
      if (output.includes(marker)) {
        // Command completed, cleanup and resolve
        shellProcess.stdout!.removeListener('data', onData);
        shellProcess.stderr!.removeListener('data', onError);
        
        // Remove marker from output and clean up
        const cleanOutput = output.replace(new RegExp(`.*${marker}.*\n?`, 'g'), '').trim();
        
        if (errorOutput.trim()) {
          console.error(chalk.red(`[CMD-ERROR] ${errorOutput.trim()}`));
        }
        
        // Only log cleanOutput if VERBOSE is enabled
        const isVerbose = ctx.context.get('VERBOSE') === true || ctx.context.get('VERBOSE') === 'true';
        if (cleanOutput && isVerbose) {
          console.log(cleanOutput);
        }
        
        resolve();
      }
    };

    const onError = (data: Buffer) => {
      errorOutput += data.toString();
    };

    // Set up error timeout as fallback (30 seconds)
    const timeout = setTimeout(() => {
      shellProcess.stdout!.removeListener('data', onData);
      shellProcess.stderr!.removeListener('data', onError);
      console.error(chalk.red(`[CMD-TIMEOUT] Command timed out after 30 seconds`));
      if (output) {
        console.log(output);
      }
      resolve();
    }, 30000);

    shellProcess.stdout!.on('data', onData);
    shellProcess.stderr!.on('data', onError);

    // Send command followed by marker
    shellProcess.stdin!.write(`${command}\n`);
    shellProcess.stdin!.write(`${echoCommand}\n`);
    
    // Clear timeout when command completes normally
    shellProcess.stdout!.on('removeListener', () => {
      clearTimeout(timeout);
    });
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