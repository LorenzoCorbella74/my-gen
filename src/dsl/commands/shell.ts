import chalk from "chalk";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";
import { randomUUID } from "crypto";

export interface ShellResult {
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
      this.resolvers.push(resolve);

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
}

export async function handleShell(node: AstNode, ctx: CommandContext): Promise<void> {
  const command = ctx.context.interpolate(node.payload);
  console.log(chalk.gray(`[CMD] > ${command}`));
  ctx.globalShell.run(command)
}