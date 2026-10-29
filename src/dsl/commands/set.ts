import * as fs from "fs/promises";
import { AiNode, AstNode } from "./types.js";
import { CommandContext, CommandResult } from "./types.js";
import {
  promptCheckbox,
  promptConfirm,
  promptInput,
  promptSelect,
  withProgress,
} from "../../utils/prompts.js";

export async function handleSet(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    const assignment = ctx.context.interpolate(node.payload);
    const [varName, ...valueParts] = assignment.split('=').map(s => s.trim());
    
    if (!varName || valueParts.length === 0) {
      return {
        error: "Invalid assignment syntax. Expected: variable = value"
      };
    }

    const value = valueParts.join('=').trim();

    if (value.startsWith('@input ')) {
      const prompt = value.substring(7);
      const userInput = await promptInput(prompt);
      ctx.context.set(varName, userInput);
    } else if (value.startsWith('@select ')) {
      const match = value.match(/^@select\s+(.*?)\s*\?\s*\[(.*?)\]\s*$/);
      if (match) {
          const promptText = ctx.context.interpolate(match[1].trim());
          const options = match[2].split(/\s+/).filter(opt => opt.length > 0);
          if (options.length === 0) {
              throw new Error('Invalid @select syntax. Use: @select Question text? [ option1 option2 option3 ]');
          }
          const userChoice = await promptSelect(
            promptText,
            options.map((option) => ({ name: option, value: option })),
          );
          ctx.context.set(varName, userChoice);
      } else {
          throw new Error('Invalid @select syntax. Use: @select Question text? [ option1 option2 option3 ]');
      }
    } else if (value.startsWith('@multiselect ')) {
      const match = value.match(/^@multiselect\s+(.*?)\s*\?\s*\[(.*?)\]\s*$/);
      if (match) {
          const promptText = ctx.context.interpolate(match[1].trim());
          const options = match[2].split(/\s+/).filter(opt => opt.length > 0);
          if (options.length === 0) {
              throw new Error('Invalid @multiselect syntax. Use: @multiselect Question text? [ option1 option2 option3 ]');
          }
          const userChoices = await promptCheckbox(promptText, options);
          ctx.context.set(varName, userChoices);
      } else {
          throw new Error('Invalid @multiselect syntax. Use: @multiselect Question text? [ option1 option2 option3 ]');
      }
    } else if (value.startsWith('@confirm ')) {
      const question = value.substring('@confirm '.length).trim();
      const interpolatedQuestion = ctx.context.interpolate(question);
      
      if (!interpolatedQuestion) {
        return {
          error: 'Confirm question cannot be empty'
        };
      }

      const answer = await promptConfirm(interpolatedQuestion);

      ctx.context.set(varName, answer ? 'Y' : 'N');
    } else if (value.startsWith('@load ')) {
        const filePath = ctx.resolvePath(ctx.context.interpolate(value.substring(6).trim()));
        const content = await withProgress(
          `Loading ${filePath}`,
          () => fs.readFile(filePath, "utf-8"),
        );
        ctx.context.set(varName, content.trim());
    } else if (value.startsWith('@http ')) {
        const url = value.substring(6).trim();
        const content = await withProgress(`Fetching ${url}`, async () => {
          const response = await fetch(ctx.context.interpolate(url));
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        });
        ctx.context.set(varName, content);
    } else if (value.startsWith('@ai ')) {
        // Import the AI handler function
        const { handleAi } = await import('./ai.js');
        // Create a temporary node for the AI handler
        const aiNode: AiNode = {
            type: '@AI',
            payload: value.substring(4).trim(),
            line: node.line
        };
        const response = await withProgress(
          `Generating ${node.type}`,
          () => handleAi(aiNode, ctx),
        );
        ctx.context.set(varName, response);
    } else if (value.includes(' in ')) {
        try {
            const [itemType, dirPath] = value.split(' in ').map(s => s.trim());
            const resolvedPath = ctx.resolvePath(ctx.context.interpolate(dirPath));
            const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
            let items: string[];
            if (itemType === 'files') {
                items = entries.filter(e => e.isFile()).map(e => e.name);
            } else if (itemType === 'folders') {
                items = entries.filter(e => e.isDirectory()).map(e => e.name);
            } else {
                items = [];
            }
            ctx.context.set(varName, items);
        } catch (error) {
            throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
      // Literal value assignment
      const cleanValue = value.replace(/^["']|["']$/g, '');
      ctx.context.set(varName, cleanValue);
    }

    return {
      silent: true // Variable assignments don't need success messages
    };
    
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}