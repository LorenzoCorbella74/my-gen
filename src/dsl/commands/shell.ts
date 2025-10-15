import chalk from "chalk";
import { spawn } from "child_process";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import os from "os";
import path from "path";

function getShellCommand(): { shell: string; args: string[] } {
  if (process.env.SHELL) {
    return { shell: process.env.SHELL, args: ["-i"] }; // interactive shell
  } else if (os.platform() === "win32") {
    return { shell: process.env.COMSPEC || "cmd.exe", args: ["/k"] }; // keep cmd open
  }
  return { shell: "/bin/sh", args: ["-i"] }; // interactive shell
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
  ctx.context.set('pwd',  ctx.globalShell.cwd) // si salva la cartella di output

  // Handle shell errors
  shellProcess.on('error', (error) => {
    console.log(chalk.red(`[SHELL-ERROR] ${error.message}`));
  });

  shellProcess.on('exit', (code) => {
    console.log(chalk.yellow(`[SHELL] Global shell exited with code ${code}`));
    ctx.globalShell.process = undefined;
  });
}

function updateWorkingDirectory(ctx: CommandContext, targetDir: string, isVerbose: boolean): void {
  try {
    // Resolve the target directory relative to current working directory
    const newCwd = path.isAbsolute(targetDir) 
      ? targetDir 
      : path.resolve(ctx.globalShell.cwd, targetDir);
    
    // Normalize the path
    const normalizedCwd = path.resolve(newCwd);
    
    // Update the global shell's cwd
    ctx.globalShell.cwd = normalizedCwd;
    
    // Update the context variable as well
    ctx.context.set('pwd', normalizedCwd);
    
    if (isVerbose) {
      console.log(chalk.gray(`[SHELL-DEBUG] Updated working directory to: ${normalizedCwd}`));
    }
  } catch (error) {
    if (isVerbose) {
      console.log(chalk.yellow(`[SHELL-WARN] Could not update working directory: ${error}`));
    }
  }
}

export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));
  
  // Check if this is a cd command to update working directory
  const cdMatch = command.trim().match(/^cd\s+(.*)$/);
  
  // Debug logging (only in verbose mode)
  const isVerbose = ctx.context.get('VERBOSE') === true || ctx.context.get('VERBOSE') === 'true';
  if (isVerbose) {
    console.log(chalk.gray(`[SHELL-DEBUG] Raw payload: "${node.payload}"`));
    console.log(chalk.gray(`[SHELL-DEBUG] Interpolated command: "${command}"`));
    console.log(chalk.gray(`[SHELL-DEBUG] Line number: ${node.line}`));
    console.log(chalk.gray(`[SHELL-DEBUG] OutputDir: ${ctx.outputDir}`));
    console.log(chalk.gray(`[SHELL-DEBUG] Global shell exists: ${!!ctx.globalShell.process}`));
    if (cdMatch) {
      console.log(chalk.gray(`[SHELL-DEBUG] CD command detected: ${cdMatch[1]}`));
    }
  }

  // Initialize global shell if needed
  initGlobalShell(ctx);

  const shellProcess = ctx.globalShell.process;
  if (!shellProcess || !shellProcess.stdin || !shellProcess.stdout || !shellProcess.stderr) {
    throw new Error('Global shell not available');
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
      
      if (isVerbose) {
        console.log(chalk.gray(`[SHELL-DEBUG] Received chunk: ${JSON.stringify(dataStr)}`));
      }
      
      // Check if marker is present in output (more aggressive detection)
      if (output.includes(marker) || dataStr.includes(marker)) {
        // Command completed, cleanup and resolve
        shellProcess.stdout!.removeListener('data', onData);
        shellProcess.stderr!.removeListener('data', onError);
        clearTimeout(timeout);
        
        // Remove marker from output and clean up
        const cleanOutput = output.replace(new RegExp(`.*${marker}.*\n?`, 'g'), '').trim();
        
        if (errorOutput.trim()) {
          console.log(chalk.red(`[CMD-ERROR] ${errorOutput.trim()}`));
        }
        
        // Only log cleanOutput if VERBOSE is enabled
        if (cleanOutput && isVerbose) {
          console.log(chalk.gray(`[SHELL-OUTPUT] ${cleanOutput}`));
        }
        
        if (isVerbose) {
          console.log(chalk.gray(`[SHELL-DEBUG] Marker detected, command completed`));
        }
        
        // Update working directory if this was a cd command
        if (cdMatch && !errorOutput.trim()) {
          updateWorkingDirectory(ctx, cdMatch[1], isVerbose);
        }
        
        resolve();
      }
    };

    const onError = (data: Buffer) => {
      errorOutput += data.toString();
    };

    // Set up error timeout as fallback (reduce to 10 seconds for faster feedback)
    const timeout = setTimeout(() => {
      shellProcess.stdout!.removeListener('data', onData);
      shellProcess.stderr!.removeListener('data', onError);
      if (isVerbose) {
        console.log(chalk.red(`[CMD-TIMEOUT] Command timed out after 10 seconds`));
        console.log(chalk.red(`[CMD-TIMEOUT] Command was: ${command}`));
        console.log(chalk.red(`[CMD-TIMEOUT] Marker was: ${marker}`));
        console.log(chalk.red(`[CMD-TIMEOUT] Output so far: ${JSON.stringify(output)}`));
      }
      if (output && isVerbose) {
        console.log(output);
      }
      // Don't throw error on timeout, just resolve
      resolve();
    }, 10000); // Reduced from 30 seconds to 10 seconds

    shellProcess.stdout!.on('data', onData);
    shellProcess.stderr!.on('data', onError);

    // Send command followed by marker
    if (isVerbose) {
      console.log(chalk.gray(`[SHELL-DEBUG] Sending command: "${command}"`));
      console.log(chalk.gray(`[SHELL-DEBUG] Sending marker command: "${echoCommand}"`));
    }
    
    // Send the actual command
    shellProcess.stdin!.write(`${command}\n`);
    
    // Wait a bit then send marker - this helps with command sequencing
    setTimeout(() => {
      shellProcess.stdin!.write(`${echoCommand}\n`);
      if (isVerbose) {
        console.log(chalk.gray(`[SHELL-DEBUG] Marker command sent`));
      }
    }, 100);
    
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