import chalk from "chalk";
import { Ollama } from "ollama";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";

export async function handleAi(node: AstNode, ctx: CommandContext): Promise<string> {
  const prompt = ctx.context.interpolate(node.payload.trim());
  
  if (!prompt) {
    throw new Error('AI prompt cannot be empty');
  }

  // Get configuration from global context
  const model = await ctx.globalContext.get('AI_MODEL') || 'llama3.2:latest';
  const systemPrompt = await ctx.globalContext.get('AI_SYSTEM_PROMPT') || undefined;
  const temperature = await ctx.globalContext.get('AI_TEMPERATURE') || 0.7;
  const host = await ctx.globalContext.get('AI_OLLAMA_HOST') || 'http://127.0.0.1:11434';

  console.log(chalk.cyan(`[AI] Using model: ${model} on ${host}`));

  try {
    // Create Ollama client with custom host if specified
    const ollama = new Ollama({ host });

    // Prepare the request
    const request: any = {
      model,
      prompt,
      stream: false, // We want the complete response, not streaming
      options: {
        temperature: Number(temperature)
      }
    };

    // Add system prompt if provided
    if (systemPrompt) {
      request.system = ctx.context.interpolate(systemPrompt);
    }

    // Make the request
    const response = await ollama.generate(request) as any;
    
    // Return only the text content
    return response.response;

  } catch (error) {
    if (error instanceof Error) {
      // Handle specific Ollama errors
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        throw new Error(`Cannot connect to Ollama server at ${host}. Please ensure Ollama is running.`);
      } else if (error.message.includes('model') && error.message.includes('not found')) {
        throw new Error(`Model "${model}" not found. Please pull the model first with: ollama pull ${model}`);
      } else {
        throw new Error(`AI request failed: ${error.message}`);
      }
    } else {
      throw new Error(`AI request failed: ${String(error)}`);
    }
  }
}

// Regular command handler wrapper for direct @AI usage
export async function handleAiCommand(node: AstNode, ctx: CommandContext): Promise<void> {
  try {
    const result = await handleAi(node, ctx);
    console.log(chalk.green(`[AI]: ${result}`));
  } catch (error) {
    throw error;
  }
}