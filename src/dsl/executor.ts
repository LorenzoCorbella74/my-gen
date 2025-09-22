// Command Executor
// This file will contain the logic to execute the AST nodes.

import * as fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import process from "node:process";
import chalk from "chalk";
import * as path from "path";
import { AstNode } from "./parser.js";
import { Context } from "./context.js";

const execAsync = promisify(exec);

type CommandFunction = (node: AstNode) => Promise<void>;

export class Executor {
  private context: Context;
  private commands: Map<string, CommandFunction> = new Map();
  private outputDir: string;

  constructor(context: Context, outputDir: string) {
    this.context = context;
    this.outputDir = outputDir;
    this.registerCommands();
  }

  private resolvePath(p: string): string {
    if (path.isAbsolute(p)) {
      return p;
    }
    return path.resolve(this.outputDir, p);
  }

  private registerCommands() {
    this.commands.set("@LOG", this.handleLog.bind(this));
    this.commands.set("@SET", this.handleSet.bind(this));
    this.commands.set(">", this.handleShell.bind(this));
    this.commands.set("WRITE", this.handleWrite.bind(this));
    this.commands.set("SAVE", this.handleWrite.bind(this)); // Alias
    this.commands.set("IF", this.handleIf.bind(this));
    this.commands.set("FOREACH", this.handleForeach.bind(this));
    this.commands.set("COMPILE", this.handleCompile.bind(this));
  }

  private async handleLog(node: AstNode): Promise<void> {
    const message = this.context.interpolate(node.payload);
    console.log(chalk.blue(`[LOG] ${message}`));
  }

  private async handleSet(node: AstNode): Promise<void> {
    const payload = node.payload;
    const [varName, ...valueParts] = payload.split('=').map((s: string) => s.trim());
    const valueExpression = valueParts.join('=').trim();

    let finalValue: any;

    if (valueExpression.startsWith('input:')) {
      const promptText = valueExpression.substring(6).trim();

      console.log(chalk.yellow(`[INFO] Prompt required: ${this.context.interpolate(promptText)}`));
      finalValue = `PROMPT_INPUT_FOR_${varName}`;
    } else if (valueExpression.startsWith('load ')) {
      const filePath = this.resolvePath(this.context.interpolate(valueExpression.substring(5).trim()));
      finalValue = await fs.readFile(filePath, "utf-8");
    } else if (valueExpression.startsWith('http ')) {
      const url = valueExpression.substring(5).trim();
      const response = await fetch(this.context.interpolate(url));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      finalValue = await response.text();
    } else if (valueExpression.startsWith('files in ')) {
      const dirPath = this.resolvePath(this.context.interpolate(valueExpression.substring(9).trim()));
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      finalValue = entries.filter(e => e.isFile()).map(e => e.name);
    } else if (valueExpression.startsWith('folders in ')) {
      const dirPath = this.resolvePath(this.context.interpolate(valueExpression.substring(11).trim()));
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      finalValue = entries.filter(e => e.isDirectory()).map(e => e.name);
    } else {
      finalValue = this.context.interpolate(valueExpression);
    }

    this.context.set(varName, finalValue);
    const valueForLog = typeof finalValue === 'string' && finalValue.length > 100 ?
      finalValue.substring(0, 100) + '...' : Array.isArray(finalValue) ? `[${finalValue.join(', ')}]` :
        finalValue;
    console.log(chalk.gray(`[SET] ${varName} = ${valueForLog}`));
  }

  private async handleShell(node: AstNode): Promise<void> {
    const command = this.context.interpolate(node.payload);
    console.log(chalk.gray(`[CMD] > ${command}`));

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.outputDir });
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

  private async handleWrite(node: AstNode): Promise<void> {
    const payload = node.payload;
    const match = payload.match(/^(?:("(.+?)")|(\w+))\s+to\s+(.+)$/);

    if (!match) {
      console.error(chalk.red(`[WRITE-ERROR] Invalid syntax. Use: WRITE \"<content>\" to <path> OR WRITE <variable> to <path>`));
      return;
    }

    const [, , literalContent, variableName, filePath] = match;

    let contentToWrite: string;
    if (literalContent) {
      contentToWrite = this.context.interpolate(literalContent);
    } else if (variableName) {
      contentToWrite = this.context.get(variableName);
      if (contentToWrite === undefined) {
        console.error(chalk.red(`[WRITE-ERROR] Variable "${variableName}" is not defined.`));
        return;
      }
    } else {
      console.error(chalk.red(`[WRITE-ERROR] Invalid content specified.`));
      return;
    }

    const finalPath = this.resolvePath(this.context.interpolate(filePath));
    console.log('Saving to :', finalPath );
    await fs.writeFile(finalPath, String(contentToWrite));
    console.log(chalk.green(`[WRITE] Content written to ${finalPath}`));
  }

  private async applyTemplate(templateContent: string, data: Record<string, any>): Promise<string> {
    let content = templateContent;
    for (const key in data) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      content = content.replace(regex, String(data[key]));
    }
    return content;
  }

  private async handleCompile(node: AstNode): Promise<void> {
    const payload = node.payload;
    const match = payload.match(/^(?<filePath>.+?)\s+with\s+template\s+(?<templateName>.+?)\s+and\s+(?<json>\{.*\})$/);

    if (!match || !match.groups) {
      throw new Error(`Invalid COMPILE syntax. Use: compile <path> with template <template_name> and { ... }`);
    }

    const { filePath, templateName, json } = match.groups;

    const finalFilePath = this.resolvePath(this.context.interpolate(filePath));
    const finalTemplateName = this.context.interpolate(templateName);

    // 1. Get the template content from the context (loaded from config.json)
    const templateContent = this.context.get(`templates.${finalTemplateName}`);
    if (typeof templateContent !== 'string') {
      throw new Error(`Template "${finalTemplateName}" not found or not a string in config.json templates.`);
    }

    // 2. Interpolate the JSON state string itself
    const interpolatedJsonString = this.context.interpolate(json);

    // 3. Parse the JSON data
    let templateData: Record<string, any> = {};
    try {
      templateData = JSON.parse(interpolatedJsonString);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON provided for template state: ${message}`);
    }

    // 4. Apply template
    const finalContent = await this.applyTemplate(templateContent, templateData);

    // 5. Write final file
    await fs.writeFile(finalFilePath, finalContent);
    console.log(chalk.green(`[COMPILE] Created ${finalFilePath} from template ${finalTemplateName}`));
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.stat(path);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  private async evaluateCondition(condition: string): Promise<boolean> {
    const [type, ...args] = condition.split(/\s+/);
    const p = this.context.interpolate(args.join(' '));
    const finalPath = this.resolvePath(p);

    if (type === 'exists') {
      return await this.fileExists(finalPath);
    } else if (type === 'not_exists') {
      return !(await this.fileExists(finalPath));
    }

    return false;
  }

  private async handleIf(node: AstNode): Promise<void> {
    if (await this.evaluateCondition(node.payload)) {
      await this.execute(node.children || []);
    }
  }

  private async handleForeach(node: AstNode): Promise<void> {
    const [itemName, , listVar] = node.payload.split(/\s+/);
    const list = this.context.get(listVar);

    if (!Array.isArray(list)) {
      console.error(chalk.red(`[FOREACH-ERROR] Variable "${listVar}" is not an array.`));
      return;
    }

    for (const item of list) {
      this.context.set(itemName, item);
      await this.execute(node.children || []);
    }
  }

  public async execute(nodes: AstNode[]) {
    for (const node of nodes) {
      const commandFn = this.commands.get(node.type.toUpperCase());
      if (commandFn) {
        try {
          await commandFn(node);
        } catch (error) {
          if (error && typeof error === "object" && "message" in error) {
            console.error(chalk.red(`Error executing command at line ${node.line}: ${(error as { message: string }).message}`));
          } else {
            console.error(chalk.red(`Error executing command at line ${node.line}: ${String(error)}`));
          }
          process.exit(1);
        }
      } else {
        console.error(chalk.red(`Unknown command "${node.type}" at line ${node.line}`));
        process.exit(1);
      }
    }
  }
}
