import chalk from "chalk";
import * as fs from "fs/promises";
import { input, select, checkbox } from '@inquirer/prompts';
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleGlobal(node: AstNode, ctx: CommandContext): Promise<void> {
  const payload = node.payload;
  const [varName, ...valueParts] = payload.split('=').map((s: string) => s.trim());
  const valueExpression = valueParts.join('=').trim();

  let finalValue: any;

  // Same logic as handleSet for determining the value
  if (valueExpression.startsWith('input:')) {
    const promptText = ctx.context.interpolate(valueExpression.substring(6).trim());
    const answer = await input({ message: promptText });
    finalValue = answer
  } else if (valueExpression.startsWith('select:')) {
    const match = valueExpression.match(/^select:(.*?):\[(.*?)\]$/);
    if (match) {
      const promptText = ctx.context.interpolate(match[1].trim());
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
      const promptText = ctx.context.interpolate(match[1].trim());
      const options = match[2].split(',').map((opt: string) => opt.trim());
      const answer = await checkbox({
        message: promptText,
        choices: options
      });
      finalValue = answer;
    } else {
      throw new Error('Invalid multiselect syntax. Use: multiselect:<prompt>:[v1,v2,v3]');
    }
  } else if (valueExpression.startsWith('@load ') || valueExpression.startsWith('load ')) {
    const prefixLength = valueExpression.startsWith('@load ') ? 6 : 5;
    const filePath = ctx.resolvePath(ctx.context.interpolate(valueExpression.substring(prefixLength).trim()));
    finalValue = await fs.readFile(filePath, "utf-8");
  } else if (valueExpression.startsWith('@http ') || valueExpression.startsWith('http ')) {
    const prefixLength = valueExpression.startsWith('@http ') ? 6 : 5;
    const url = valueExpression.substring(prefixLength).trim();
    const response = await fetch(ctx.context.interpolate(url));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    finalValue = await response.text();
  } else if (valueExpression.startsWith('files in ')) {
    const dirPath = ctx.resolvePath(ctx.context.interpolate(valueExpression.substring(9).trim()));
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    finalValue = entries.filter(e => e.isFile()).map(e => e.name);
  } else if (valueExpression.startsWith('folders in ')) {
    const dirPath = ctx.resolvePath(ctx.context.interpolate(valueExpression.substring(11).trim()));
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    finalValue = entries.filter(e => e.isDirectory()).map(e => e.name);
  } else {
    finalValue = ctx.context.interpolate(valueExpression);
  }

  // Save the new variable and sync context
  await ctx.globalContext.setGlobalVariable(varName, finalValue);
  await ctx.globalContext.syncContextWithGlobals(ctx.context);

  const valueForLog = typeof finalValue === 'string' && finalValue.length > 100 ?
    finalValue.substring(0, 100) + '...' : 
    Array.isArray(finalValue) ? `[${finalValue.join(', ')}]` : finalValue;
  console.log(chalk.magenta(`[GLOBAL] ${varName} = ${valueForLog} (saved to ${ctx.globalContext.getGlobalFilePath()})`));
}