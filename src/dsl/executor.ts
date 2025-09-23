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
import { input, select, checkbox } from '@inquirer/prompts';

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
    this.commands.set("@COMPILE", this.handleCompile.bind(this));
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
      const promptText = this.context.interpolate(valueExpression.substring(6).trim());
      const answer = await input({ message: promptText });
      finalValue = answer
    } else if (valueExpression.startsWith('select:')) {
      const match = valueExpression.match(/^select:(.*?):\[(.*?)\]$/);
      if (match) {
        const promptText = this.context.interpolate(match[1].trim());
        const options = match[2].split(',').map((opt: string) => opt.trim());
        const answer = await select({
          message: promptText,
          choices: options
        });
        finalValue = answer;
      } else {
        throw new Error('Invalid select syntax. Use: select:<prompt>:[v1,v2]');
      }
    } else if (valueExpression.startsWith('multiselect:')) {
      const match = valueExpression.match(/^multiselect:(.*?):\[(.*?)\]$/);
      if (match) {
        const promptText = this.context.interpolate(match[1].trim());
        const options = match[2].split(',').map((opt: string) => opt.trim());
        const answer = await checkbox({
          message: promptText,
          choices: options
        });
        finalValue = answer;
      } else {
        throw new Error('Invalid multiselect syntax. Use: multiselect:<prompt>:[v1,v2,v3]');
      }
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
    console.log('Saving to :', finalPath);
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
    const templatePath = this.context.interpolate(node.payload.trim());
    
    // Load the template.json file
    let configData: any;
    try {
      const configContent = await fs.readFile(templatePath, 'utf8');
      configData = JSON.parse(configContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load template file "${templatePath}": ${message}`);
    }

    // Check if templates property exists
    if (!configData.templates || typeof configData.templates !== 'object') {
      throw new Error(`Template file "${templatePath}" must contain a "templates" property with an object value`);
    }

    // Create a context with the config data for interpolation
    const templateContext = { ...this.context.getAllVariables(), ...configData };
    
    console.log(chalk.blue(`[COMPILE] Processing template file: ${templatePath}`));

    // Loop over each template and create files/folders
    for (const [filePath, content] of Object.entries(configData.templates)) {
      if (typeof content !== 'string') {
        console.warn(chalk.yellow(`[COMPILE] Skipping non-string template: ${filePath}`));
        continue;
      }

      // Interpolate the file path
      const finalFilePath = this.resolvePath(this.interpolateString(filePath, templateContext));
      
      // Create directory if it doesn't exist
      const dir = path.dirname(finalFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Interpolate the content
      const finalContent = this.interpolateString(content as string, templateContext);

      // Write the file
      await fs.writeFile(finalFilePath, finalContent);
      console.log(chalk.green(`[COMPILE] Created: ${finalFilePath}`));
    }

    console.log(chalk.blue(`[COMPILE] Template compilation completed`));
  }

  /**
   * Helper method to interpolate a string with a given context
   */
  private interpolateString(template: string, context: Record<string, any>): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      const value = this.getNestedValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Helper method to get nested values from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
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
