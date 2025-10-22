import chalk from "chalk";
import { spawn } from "child_process";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import os from "os";
import path from "path";
import fs from "fs";

function getShellCommand(): { shell: string; args: string[] } {
  if (process.env.SHELL) {
    return { shell: process.env.SHELL, args: ["-i"] }; // interactive shell
  } else if (os.platform() === "win32") {
    return { shell: process.env.COMSPEC || "cmd.exe", args: ["/k"] }; // keep cmd open
  }
  return { shell: "/bin/sh", args: ["-i"] }; // interactive shell
}

function initGlobalShell(ctx: CommandContext): void {
  // For the new approach, we only need to initialize the working directory
  if (!ctx.globalShell.cwd) {
    ctx.globalShell.cwd = ctx.outputDir;
  }
  
  console.log(chalk.gray(`[SHELL] Using deterministic shell execution in: ${ctx.globalShell.cwd}`));
}

async function handleCdCommand(command: string, ctx: CommandContext, isVerbose: boolean): Promise<void> {
  const cdMatch = command.match(/^cd\s+(.*)$/i);
  if (!cdMatch) {
    throw new Error('Invalid cd command');
  }
  
  let targetDir = cdMatch[1].trim();
  let newCwd: string;
  
  // Handle quoted paths (remove quotes)
  if ((targetDir.startsWith('"') && targetDir.endsWith('"')) || 
      (targetDir.startsWith("'") && targetDir.endsWith("'"))) {
    targetDir = targetDir.slice(1, -1);
  }
  
  // Handle special cases
  if (targetDir === '' || targetDir === '~') {
    // Empty cd or ~ goes to home directory
    newCwd = os.homedir();
  } else if (targetDir === '.') {
    // Current directory - no change needed
    newCwd = ctx.globalShell.cwd;
  } else if (path.isAbsolute(targetDir)) {
    // Absolute path
    newCwd = path.normalize(targetDir);
  } else {
    // Relative path - let path.resolve handle all the .. combinations
    newCwd = path.resolve(ctx.globalShell.cwd, targetDir);
  }
  
  // Normalize the path to handle edge cases
  newCwd = path.normalize(newCwd);
  
  // Verify directory exists
  if (!fs.existsSync(newCwd)) {
    throw new Error(`Directory does not exist: ${newCwd}`);
  }
  
  // Verify it's actually a directory
  const stats = fs.statSync(newCwd);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${newCwd}`);
  }
  
  ctx.globalShell.cwd = newCwd;
  
  if (isVerbose) {
    console.log(chalk.gray(`[SHELL-DEBUG] Changed directory from: ${ctx.globalShell.cwd}`));
    console.log(chalk.gray(`[SHELL-DEBUG] Changed directory to: ${newCwd}`));
  }
}

async function executeCommandDeterministic(command: string, ctx: CommandContext, isVerbose: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const { shell, args } = getShellCommand();
    
    // Create command array based on platform
    let cmdArgs: string[];
    if (os.platform() === "win32") {
      cmdArgs = ['/c', command]; // Use /c for single command execution
    } else {
      cmdArgs = ['-c', command];
    }
    
    if (isVerbose) {
      console.log(chalk.gray(`[SHELL-DEBUG] Executing: ${shell} ${cmdArgs.join(' ')}`));
      console.log(chalk.gray(`[SHELL-DEBUG] Working directory: ${ctx.globalShell.cwd}`));
    }
    
    const childProcess = spawn(shell, cmdArgs, {
      cwd: ctx.globalShell.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (isVerbose && output.trim()) {
        console.log(chalk.gray(`[SHELL-OUTPUT] ${output.trim()}`));
      }
    });
    
    childProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      if (isVerbose && error.trim()) {
        console.log(chalk.red(`[SHELL-ERROR] ${error.trim()}`));
      }
    });
    
    childProcess.on('close', (code) => {
      if (isVerbose) {
        console.log(chalk.gray(`[SHELL-DEBUG] Command completed with exit code: ${code}`));
      }
      
      if (stderr.trim() && code !== 0) {
        console.log(chalk.red(`[CMD-ERROR] ${stderr.trim()}`));
      }
      
      // Always resolve to continue execution even on error
      resolve();
    });
    
    childProcess.on('error', (error) => {
      if (isVerbose) {
        console.log(chalk.red(`[SHELL-DEBUG] Process error: ${error.message}`));
      }
      reject(error);
    });
    
    // Set timeout for long-running commands
    const timeout = setTimeout(() => {
      if (isVerbose) {
        console.log(chalk.red(`[SHELL-TIMEOUT] Command timed out after 60 seconds: ${command}`));
      }
      childProcess.kill('SIGTERM');
      resolve(); // Resolve even on timeout
    }, 60000); // 60 seconds timeout
    
    childProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));
  
  // Debug logging (only in verbose mode)
  const isVerbose = ctx.context.get('VERBOSE') === true || ctx.context.get('VERBOSE') === 'true';
  if (isVerbose) {
    console.log(chalk.gray(`[SHELL-DEBUG] Raw payload: "${node.payload}"`));
    console.log(chalk.gray(`[SHELL-DEBUG] Interpolated command: "${command}"`));
    console.log(chalk.gray(`[SHELL-DEBUG] Line number: ${node.line}`));
    console.log(chalk.gray(`[SHELL-DEBUG] OutputDir: ${ctx.outputDir}`));
    console.log(chalk.gray(`[SHELL-DEBUG] Current working directory: ${ctx.globalShell.cwd}`));
  }

  // Initialize shell context if needed
  initGlobalShell(ctx);

  // For cd commands, handle them specially to update context
  if (command.trim().toLowerCase().startsWith('cd ')) {
    return handleCdCommand(command, ctx, isVerbose);
  }

  // For other commands, use deterministic execution
  return executeCommandDeterministic(command, ctx, isVerbose);
}

// Helper function to cleanup global shell
export function cleanupGlobalShell(ctx: CommandContext): void {
  // For deterministic approach, just reset the working directory
  ctx.globalShell.cwd = ctx.outputDir;
  console.log(chalk.gray('[SHELL] Reset shell context'));
}