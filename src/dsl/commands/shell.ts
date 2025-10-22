import chalk from "chalk";
/* import { ChildProcessWithoutNullStreams, spawn } from "child_process"; */
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
/* import os from "os";
import { randomUUID } from "crypto"; */

/* export interface ShellResult {
  stdout: string;
  stderr: string;
  code: number;
}

export class ShellSession {
  shell: ChildProcessWithoutNullStreams;
  pwd: string;
  private bufferOut = "";
  private bufferErr = "";
  private resolvers: ((res: ShellResult) => void)[] = [];
  private pendingId: string | null = null;

  constructor(outputDir: string) {
    this.pwd = outputDir;
    const shellCmd = process.platform === "win32"
      ? process.env.ComSpec || "cmd.exe"
      : process.env.SHELL || "bash";

    this.shell = spawn(shellCmd, [""], {
      stdio: "pipe",
      cwd: outputDir,
      env: process.env,
    });

    this.shell.stdout.setEncoding("utf8");
    this.shell.stderr.setEncoding("utf8");

    this.shell.stdout.on("data", (data) => this.onStdout(data));
    this.shell.stderr.on("data", (data) => this.onStderr(data));
  }

  private onStdout(data: string) {
    this.bufferOut += data;
    const match = this.bufferOut.match(/__CMD_DONE__:(\S+):(\d+)/);
    if (match && this.pendingId === match[1]) {
      const [, id, codeStr] = match;
      if (id && codeStr) {
        const code = parseInt(codeStr, 10);
        const output = this.bufferOut.split(`__CMD_DONE__:${id}:${codeStr}`)[0]?.trim() || "";

        const resolver = this.resolvers.shift();
        if (resolver) {
          resolver({
            stdout: output,
            stderr: this.bufferErr.trim(),
            code,
          });
        }

        // Reset buffer
        this.bufferOut = "";
        this.bufferErr = "";
        this.pendingId = null;
      }
    }
  }

  private onStderr(data: string) {
    this.bufferErr += data;
  }

  async run(cmd: string): Promise<ShellResult> {
    const id = randomUUID();
    this.pendingId = id;

    return new Promise((resolve) => {
      this.resolvers.push(async (result) => {
        await this.updatePwd();
        resolve(result);
      });

      const marker =
        process.platform === "win32"
          ? `echo __CMD_DONE__:${id}:%errorlevel%`
          : `echo __CMD_DONE__:${id}:$?`;

      // Importante: esegue in blocco e forza flush
      const fullCommand =
        process.platform === "win32"
          ? `${cmd} & ${marker}\n`
          : `${cmd}; ${marker}\n`;

      this.shell.stdin.write(fullCommand);
    });
  }

  close() {
    console.log(chalk.gray('[SHELL] Closing global shell'));
    this.shell.stdin.end();
  }

  private async updatePwd() {
    const result = await this._runInternal(process.platform === "win32" ? "cd" : "pwd");
    const newPwd = result.stdout.trim();
    if (newPwd) this.pwd = newPwd;
  }

  private _runInternal(cmd: string): Promise<ShellResult> {
    const id = randomUUID();
    this.pendingId = id;

    return new Promise((resolve) => {
      this.resolvers.push(resolve);

      const marker =
        process.platform === "win32"
          ? `echo __CMD_DONE__:${id}:%errorlevel%`
          : `echo __CMD_DONE__:${id}:$?`;

      const fullCommand =
        process.platform === "win32"
          ? `${cmd} & ${marker}`
          : `${cmd}; ${marker}`;

      this.shell.stdin.write(fullCommand + "\n");
    });
  }
} */

  import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * Shell persistente ma non interattiva.
 * Ogni comando viene eseguito nella directory corrente (`pwd`),
 * e i comandi `cd` aggiornano lo stato interno.
 */
export class ShellSession {
  /** Directory corrente della sessione */
  pwd: string;

  constructor(outputDir:string){
    this.pwd = outputDir || process.cwd();
  }
  /**
   * Esegue un comando shell nella directory corrente.
   */
  async run(cmd: string): Promise<ShellResult> {
    // Comando completo con cd implicito
    const fullCommand = process.platform === "win32"
      ? `cd /d "${this.pwd}" && ${cmd}`
      : `cd "${this.pwd}" && ${cmd}`;

    try {
      // Aggiorna la directory corrente se il comando è un "cd"
      this.updatePwdIfNeeded(cmd);
      const { stdout, stderr } = await execAsync(fullCommand);


      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: 0,
      };
    } catch (err: any) {
      return {
        stdout: (err.stdout || "").trim(),
        stderr: (err.stderr || err.message || "").trim(),
        code: err.code ?? 1,
      };
    }
  }

  /**
   * Aggiorna lo stato interno della directory corrente
   * se il comando è un "cd" o "cd .." o simile.
   */
  private updatePwdIfNeeded(cmd: string) {
    const cdMatch = cmd.match(/^\s*cd\s+(.+)/i);
    if (cdMatch) {
      const newPath = cdMatch[1].trim().replace(/^['"]|['"]$/g, "");
      this.pwd = path.resolve(this.pwd, newPath);
    }
  }
}


export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));
  ctx.globalShell.run(command)
}