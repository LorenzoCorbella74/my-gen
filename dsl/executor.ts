// Command Executor
// This file will contain the logic to execute the AST nodes.

import { AstNode } from "./parser.ts";
import { Context } from "./context.ts";
import { blue, gray, green, red } from "@std/fmt/colors";

type CommandFunction = (node: AstNode) => Promise<void>;

export class Executor {
  private context: Context;
  private commands: Map<string, CommandFunction> = new Map();

  constructor(context: Context) {
    this.context = context;
    this.registerCommands();
  }

  private registerCommands() {
    this.commands.set("LOG", this.handleLog.bind(this));
    this.commands.set("SET", this.handleSet.bind(this));
    this.commands.set(">", this.handleShell.bind(this));
    this.commands.set("WRITE", this.handleWrite.bind(this));
    this.commands.set("SAVE", this.handleWrite.bind(this)); // Alias
    this.commands.set("IF", this.handleIf.bind(this));
    this.commands.set("FOREACH", this.handleForeach.bind(this));
    this.commands.set("COMPILE", this.handleCompile.bind(this));
  }

  private async handleLog(node: AstNode): Promise<void> {
    const message = this.context.interpolate(node.payload);
    console.log(blue(`[LOG] ${message}`));
  }

  private async handleSet(node: AstNode): Promise<void> {
    const payload = node.payload;
    const [varName, ...valueParts] = payload.split('=').map((s: string) => s.trim());
    const valueExpression = valueParts.join('=').trim();

    let finalValue: any;

    if (valueExpression.startsWith('input:')) {
      const promptText = valueExpression.substring(6).trim();
      finalValue = await prompt(this.context.interpolate(promptText));
    } else if (valueExpression.startsWith('load ')) {
        const filePath = valueExpression.substring(5).trim();
        finalValue = await Deno.readTextFile(this.context.interpolate(filePath));
    } else if (valueExpression.startsWith('http ')) {
        const url = valueExpression.substring(5).trim();
        const response = await fetch(this.context.interpolate(url));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        finalValue = await response.text();
    } else if (valueExpression.startsWith('files in ')) {
        const dirPath = valueExpression.substring(9).trim();
        finalValue = [];
        for await (const dirEntry of Deno.readDir(this.context.interpolate(dirPath))) {
            if (dirEntry.isFile) {
                finalValue.push(dirEntry.name);
            }
        }
    } else if (valueExpression.startsWith('folders in ')) {
        const dirPath = valueExpression.substring(11).trim();
        finalValue = [];
        for await (const dirEntry of Deno.readDir(this.context.interpolate(dirPath))) {
            if (dirEntry.isDirectory) {
                finalValue.push(dirEntry.name);
            }
        }
    } else {
      finalValue = this.context.interpolate(valueExpression);
    }

    this.context.set(varName, finalValue);
    const valueForLog = typeof finalValue === 'string' && finalValue.length > 100 ? finalValue.substring(0, 100) + '...' : Array.isArray(finalValue) ? `[${finalValue.join(', ')}]` : finalValue;
    console.log(gray(`[SET] ${varName} = ${valueForLog}`));
  }

  private async handleShell(node: AstNode): Promise<void> {
    const command = this.context.interpolate(node.payload);
    console.log(gray(`[CMD] > ${command}`));

    const shell = Deno.build.os === "windows" ? "cmd" : "sh";
    const shellArgs = Deno.build.os === "windows" ? ["/c"] : ["-c"];

    const cmd = new Deno.Command(shell, { args: [...shellArgs, command], stdout: "piped", stderr: "piped" });
    const { code, stdout, stderr } = await cmd.output();

    if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        console.error(red(`[CMD-ERROR] ${errorText}`));
    }
    const outputText = new TextDecoder().decode(stdout);
    if(outputText) {
        console.log(outputText);
    }
  }

  private async handleWrite(node: AstNode): Promise<void> {
    const payload = node.payload;
    const match = payload.match(/^(?:("(.+?)")|(\w+))\s+to\s+(.+)$/);

    if (!match) {
        console.error(red(`[WRITE-ERROR] Invalid syntax. Use: WRITE \"<content>\" to <path> OR WRITE <variable> to <path>`));
        return;
    }

    const [, , literalContent, variableName, filePath] = match;

    let contentToWrite: string;
    if (literalContent) {
        contentToWrite = this.context.interpolate(literalContent);
    } else if (variableName) {
        contentToWrite = this.context.get(variableName);
    } else {
        console.error(red(`[WRITE-ERROR] Invalid content specified.`));
        return;
    }

    await Deno.writeTextFile(this.context.interpolate(filePath), contentToWrite);
    console.log(green(`[WRITE] Content written to ${this.context.interpolate(filePath)}`));
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

    if (!match) {
        throw new Error(`Invalid COMPILE syntax. Use: compile <path> with template <template_name> and { ... }`);
    }

    const { filePath, templateName, json } = match.groups!;

    const finalFilePath = this.context.interpolate(filePath);
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
    await Deno.writeTextFile(finalFilePath, finalContent);
    console.log(green(`[COMPILE] Created ${finalFilePath} from template ${finalTemplateName}`));
  }

  private async evaluateCondition(condition: string): Promise<boolean> {
    const [type, ...args] = condition.split(/\s+/);
    const path = this.context.interpolate(args.join(' '));
    try {
        if (type === 'exists') {
            await Deno.stat(path);
            return true;
        } else if (type === 'not_exists') {
            await Deno.stat(path);
            return false;
        }
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return type === 'not_exists';
        }
        throw error;
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
        console.error(red(`[FOREACH-ERROR] Variable "${listVar}" is not an array.`));
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
                console.error(red(`Error executing command at line ${node.line}: ${(error as { message: string }).message}`));
            } else {
                console.error(red(`Error executing command at line ${node.line}: ${String(error)}`));
            }
            Deno.exit(1);
        }
      } else {
        console.error(red(`Unknown command "${node.type}" at line ${node.line}`));
        Deno.exit(1);
      }
    }
  }
}
