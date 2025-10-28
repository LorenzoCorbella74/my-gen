import chalk from "chalk";
import * as fs from "fs/promises";
import { AstNode } from "../parser.js";
import { CommandContext, CommandResult } from "./types.js";
import path from "path";

export async function handleWrite(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    const payload = ctx.context.interpolate(node.payload);
    const toIndex = payload.toLowerCase().lastIndexOf(" to ");

    if (toIndex === -1) {
      return {
        error: "Invalid write syntax. Expected: content to filepath",
      };
    }

    const contentPart = payload.substring(0, toIndex).trim();
    const filePath = payload.substring(toIndex + 4).trim();

    let content: string;
    if (contentPart.startsWith('"') && contentPart.endsWith('"')) {
      content = contentPart.slice(1, -1);
    } else if (contentPart.startsWith("'") && contentPart.endsWith("'")) {
      content = contentPart.slice(1, -1);
    } else {
      const variableValue = ctx.context.get(contentPart);
      if (variableValue === undefined) {
        return {
          error: `Variable "${contentPart}" is not defined`,
        };
      }
      content = String(variableValue);
    }

    const resolvedPath = ctx.resolvePath(filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, content, "utf-8");

    return {
      success: `File written: ${filePath}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}