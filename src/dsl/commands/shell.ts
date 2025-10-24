import chalk from "chalk";
import { spawn } from "child_process";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import os from "os";
import path from "path";
import fs from "fs";

// Import cross-spawn for better cross-platform support
let crossSpawn: any;

async function loadCrossSpawn(): Promise<any> {
  if (crossSpawn !== undefined) {
    return crossSpawn;
  }
  
  try {
    const crossSpawnModule = await import('cross-spawn');
    crossSpawn = crossSpawnModule.default || crossSpawnModule;
    return crossSpawn;
  } catch (error) {
    console.log(chalk.yellow('[SHELL] cross-spawn not available, falling back to standard spawn'));
    crossSpawn = null;
    return null;
  }
}

async function shouldUseCrossSpawn(command: string): Promise<boolean> {
  // Load cross-spawn if not already loaded
  const crossSpawnModule = await loadCrossSpawn();
  if (!crossSpawnModule) return false;
  
  // Commands that benefit from cross-spawn
  const externalCommands = /^(npm|node|git|python|pip|java|gcc|make|curl|wget|yarn|pnpm)\s/i;
  
  // Commands that need shell interpretation
  const shellCommands = /[&|><]|&&|\|\||;|`|\$\(/; // pipes, redirections, chaining, command substitution
  
  const trimmedCommand = command.trim();
  return externalCommands.test(trimmedCommand) && !shellCommands.test(trimmedCommand);
}

function parseSimpleCommand(command: string): { cmd: string; args: string[] } | null {
  const trimmedCommand = command.trim();
  
  // Simple regex to split command and arguments
  // This handles basic quoted arguments but not complex shell escaping
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < trimmedCommand.length; i++) {
    const char = trimmedCommand[i];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  if (parts.length === 0) return null;
  
  const [cmd, ...args] = parts;
  return { cmd, args };
}

async function executeWithCrossSpawn(command: string, ctx: CommandContext, isVerbose: boolean): Promise<void> {
  const parsed = parseSimpleCommand(command);
  
  if (!parsed) {
    throw new Error(`Failed to parse command: ${command}`);
  }
  
  // Load cross-spawn module
  const crossSpawnModule = await loadCrossSpawn();
  if (!crossSpawnModule) {
    throw new Error('Cross-spawn not available');
  }
  
  if (isVerbose) {
    console.log(chalk.cyan(`[CROSS-SPAWN] Executing: ${parsed.cmd} ${parsed.args.join(' ')}`));
    console.log(chalk.gray(`[CROSS-SPAWN] Working directory: ${ctx.globalShell.cwd}`));
  }
  
  return new Promise((resolve, reject) => {
    const childProcess = crossSpawnModule(parsed.cmd, parsed.args, {
      cwd: ctx.globalShell.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      stdout += output;
      if (isVerbose && output.trim()) {
        console.log(chalk.gray(`[CROSS-SPAWN-OUTPUT] ${output.trim()}`));
      }
    });
    
    childProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      stderr += error;
      if (isVerbose && error.trim()) {
        console.log(chalk.red(`[CROSS-SPAWN-ERROR] ${error.trim()}`));
      }
    });
    
    childProcess.on('close', (code: number) => {
      if (isVerbose) {
        console.log(chalk.cyan(`[CROSS-SPAWN] Command completed with exit code: ${code}`));
      }
      
      if (stderr.trim() && code !== 0) {
        console.log(chalk.red(`[CMD-ERROR] ${stderr.trim()}`));
      }
      
      // Always resolve to continue execution even on error
      resolve();
    });
    
    childProcess.on('error', (error: Error) => {
      if (isVerbose) {
        console.log(chalk.red(`[CROSS-SPAWN] Process error: ${error.message}`));
      }
      reject(error);
    });
    
    // Set timeout for long-running commands
    const timeout = setTimeout(() => {
      if (isVerbose) {
        console.log(chalk.red(`[CROSS-SPAWN-TIMEOUT] Command timed out after 60 seconds: ${command}`));
      }
      childProcess.kill('SIGTERM');
      resolve(); // Resolve even on timeout
    }, 60000); // 60 seconds timeout
    
    childProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

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
  // Check if we should use cross-spawn for this command
  if (await shouldUseCrossSpawn(command)) {
    if (isVerbose) {
      console.log(chalk.cyan(`[HYBRID] Using cross-spawn for: ${command}`));
    }
    return executeWithCrossSpawn(command, ctx, isVerbose);
  }
  
  // Fall back to current shell-based approach
  if (isVerbose) {
    console.log(chalk.gray(`[HYBRID] Using shell approach for: ${command}`));
  }
  
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
      env: process.env,
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
    
    // Show hybrid decision
    if (await shouldUseCrossSpawn(command)) {
      console.log(chalk.cyan(`[SHELL-DEBUG] Will use cross-spawn for this command`));
    } else {
      console.log(chalk.yellow(`[SHELL-DEBUG] Will use shell approach for this command`));
    }
  }

  // Initialize shell context if needed
  initGlobalShell(ctx);

  // For cd commands, handle them specially to update context
  if (command.trim().toLowerCase().startsWith('cd ')) {
    return handleCdCommand(command, ctx, isVerbose);
  }

  // For other commands, use hybrid deterministic execution
  return executeCommandDeterministic(command, ctx, isVerbose);
}

// Helper function to cleanup global shell
export function cleanupGlobalShell(ctx: CommandContext): void {
  // For deterministic approach, just reset the working directory
  ctx.globalShell.cwd = ctx.outputDir;
  console.log(chalk.gray('[SHELL] Reset shell context'));
}