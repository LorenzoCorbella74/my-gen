import * as path from 'path';

/**
 * Converts a .gen file content to Markdown documentation
 * 
 * Rules:
 * - Comments (lines starting with #) → plain text
 * - Logs (lines starting with @log) → plain text
 * - @import filename.<extension> → code block with extension syntax highlighting
 * - Shell commands (>) → bash code blocks (groups consecutive commands)
 * - @fill blocks → code blocks with appropriate syntax highlighting
 */
export function convertToMarkdown(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      result.push('');
      i++;
      continue;
    }
    
    // Handle comments - convert to plain text
    if (line.startsWith('#')) {
      result.push(line.substring(1).trim()); // Remove # and leading space
      i++;
      continue;
    }
    
    // Handle @log commands - convert to plain text
    if (line.toLowerCase().startsWith('@log')) {
      const logContent = line.substring(4).trim(); // Remove @log and leading space
      result.push(logContent);
      i++;
      continue;
    }
    
    // Handle @import commands - convert to code blocks
    if (line.toLowerCase().startsWith('@import')) {
      const importPath = line.substring(7).trim(); // Remove @import and leading space
      const extension = path.extname(importPath).substring(1); // Get extension without dot
      
      result.push(`\`\`\`${extension}`);
      result.push(`// Imported from: ${importPath}`);
      result.push('```');
      result.push('');
      i++;
      continue;
    }
    
    // Handle @fill commands - convert to code blocks with content
    if (line.toLowerCase().startsWith('@fill')) {
      const filePath = line.substring(5).trim(); // Remove @fill and leading space
      const extension = path.extname(filePath).substring(1) || 'text'; // Get extension without dot
      
      result.push(`**Creating file: \`${filePath}\`**`);
      result.push('');
      result.push(`\`\`\`${extension}`);
      
      i++; // Move to next line
      
      // Look for the opening quote
      if (i < lines.length && lines[i].trim() === '"') {
        i++; // Skip the opening quote
        
        // Collect content until closing quote
        while (i < lines.length && lines[i].trim() !== '"') {
          result.push(lines[i]);
          i++;
        }
        
        if (i < lines.length && lines[i].trim() === '"') {
          i++; // Skip the closing quote
        }
      }
      
      result.push('```');
      result.push('');
      continue;
    }
    
    // Handle shell commands - group consecutive commands into bash blocks
    if (line.startsWith('>')) {
      result.push('```bash');
      
      // Collect all consecutive shell commands
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const shellCommand = lines[i].trim().substring(1).trim(); // Remove > and leading space
        result.push(shellCommand);
        i++;
      }
      
      result.push('```');
      result.push('');
      continue; // Don't increment i here as it's already done in the while loop
    }
    
    // Handle @if/@elseif/@end commands - show with proper formatting
    if (line.toLowerCase().startsWith('@if') || line.toLowerCase().startsWith('@elseif')) {
      const condition = line.substring(line.indexOf(' ') + 1).trim();
      const commandType = line.toLowerCase().startsWith('@if') ? 'If' : 'Else if';
      result.push(`**${commandType} condition:** \`${condition}\``);
      result.push('');
      i++;
      continue;
    }
    
    if (line.toLowerCase() === '@end') {
      result.push('**End condition**');
      result.push('');
      i++;
      continue;
    }
    
    // Handle @loop/@endloop commands
    if (line.toLowerCase().startsWith('@loop')) {
      const loopExpression = line.substring(5).trim();
      result.push(`**Loop:** \`${loopExpression}\``);
      result.push('');
      i++;
      continue;
    }
    
    if (line.toLowerCase() === '@endloop') {
      result.push('**End loop**');
      result.push('');
      i++;
      continue;
    }
    
    // Handle @task commands - convert to section headers
    if (line.toLowerCase().startsWith('@task')) {
      const taskName = line.substring(5).trim(); // Remove @task and leading space
      result.push(`## Task: ${taskName}`);
      result.push('');
      i++;
      continue;
    }
    
    // Handle @set, @global and other commands - show as inline code
    if (line.startsWith('@')) {
      result.push(`\`${line}\``);
      i++;
      continue;
    }
    
    // Handle other lines - show as inline code
    result.push(`\`${line}\``);
    i++;
  }
  
  return result.join('\n');
}

/**
 * Convert .gen file to markdown and save to a .md file
 */
export async function generateDocumentation(genFilePath: string, outputPath?: string): Promise<string> {
  const fs = await import('fs/promises');
  
  try {
    const content = await fs.readFile(genFilePath, 'utf-8');
    const markdown = convertToMarkdown(content);
    
    // Determine output path
    const outputFile = outputPath || genFilePath.replace('.gen', '.md');
    
    await fs.writeFile(outputFile, markdown, 'utf-8');
    
    return outputFile;
  } catch (error) {
    throw new Error(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
  }
}