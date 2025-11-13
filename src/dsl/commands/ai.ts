import chalk from "chalk";
import { Ollama } from "ollama";
import { AstNode, CommandContext, CommandResult } from "./types.js";

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
export async function handleAiCommand(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
  try {
    const prompt = ctx.context.interpolate(node.payload);
    
    // Get AI configuration from global context
    const aiModel = ctx.context.get('AI_MODEL') || 'llama3.2-latest';
    const aiTemperature = parseFloat(ctx.context.get('AI_TEMPERATURE') || '0.7');
    const aiSystemPrompt = ctx.context.get('AI_SYSTEM_PROMPT') || 'You are a helpful assistant.';
    const ollamaUrl = ctx.context.get('OLLAMA_URL') || 'http://localhost:11434';

    // Prepare request body
    const requestBody = {
      model: aiModel,
      prompt: prompt,
      temperature: aiTemperature,
      system: aiSystemPrompt,
      stream: false
    };

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      return {
        error: `AI request failed with status ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (!data.response) {
      return {
        error: 'AI response is empty or malformed'
      };
    }

    // Set the AI response in context for potential use by other commands
    ctx.context.set('AI_LAST_RESPONSE', data.response);

    return {
      success: `AI response: ${data.response.substring(0, 100)}${data.response.length > 100 ? '...' : ''}`
    };

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}