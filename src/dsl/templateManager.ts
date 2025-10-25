import * as fs from 'node:fs/promises';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import degit from 'degit';

const REPO_OWNER = 'LorenzoCorbella74';
const REPO_NAME = 'my-gen';
const BRANCH = 'main';
const TEMPLATES_PATH = 'templates';

interface TemplateInfo {
  name: string;
  filename: string;
  description?: string;
}

/**
 * Fetches the list of templates from the GitHub repository
 */
export async function listTemplates(): Promise<TemplateInfo[]> {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${TEMPLATES_PATH}?ref=${BRANCH}`;
  
  try {
    console.log(chalk.blue('📋 Fetching available templates...'));
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    
    const files = await response.json() as Array<{
      name: string;
      download_url: string;
      type: string;
    }>;
    
    // Filter only .gen files
    const genFiles = files.filter(file => 
      file.type === 'file' && file.name.endsWith('.gen')
    );
    
    const templates: TemplateInfo[] = [];
    
    // Fetch descriptions from the first comment of each file
    for (const file of genFiles) {
      try {
        const contentResponse = await fetch(file.download_url);
        if (contentResponse.ok) {
          const content = await contentResponse.text();
          const description = extractDescription(content);
          
          templates.push({
            name: file.name.replace('.gen', ''), // Remove .gen extension
            filename: file.name,
            description
          });
        }
      } catch (error) {
        // If we can't fetch the description, still include the template
        templates.push({
          name: file.name.replace('.gen', ''),
          filename: file.name
        });
      }
    }
    
    return templates;
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    } else {
      throw new Error(`Failed to fetch templates: ${String(error)}`);
    }
  }
}

/**
 * Extracts description from the first comment line of a .gen file
 */
function extractDescription(content: string): string | undefined {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      // Remove # and leading/trailing whitespace
      const description = trimmed.substring(1).trim();
      if (description) {
        return description;
      }
    } else if (trimmed && !trimmed.startsWith('#')) {
      // Stop at first non-comment, non-empty line
      break;
    }
  }
  
  return undefined;
}

/**
 * Downloads and executes a template from the repository
 */
export async function downloadAndExecuteTemplate(
  templateName: string,
  outputDir: string,
  executor: any, // Will be properly typed later
  context: any   // Will be properly typed later
): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gen-template-'));
  
  try {
    console.log(chalk.blue(`📦 Downloading template: ${templateName}...`));
    
    // Add .gen extension if not present
    const filename = templateName.endsWith('.gen') ? templateName : `${templateName}.gen`;
    
    // Use degit to download the specific file from templates folder
    const repoPath = `${REPO_OWNER}/${REPO_NAME}/${TEMPLATES_PATH}#${BRANCH}`;
    const emitter = degit(repoPath);
    
    await emitter.clone(tempDir);
    
    // Check if the template file exists
    const templatePath = path.join(tempDir, filename);
    
    try {
      await fs.access(templatePath);
    } catch (error) {
      throw new Error(`Template '${templateName}' not found. Use --list to see available templates.`);
    }
    
    console.log(chalk.green(`✅ Template downloaded successfully`));
    console.log(chalk.blue(`🚀 Executing template: ${filename}...`));
    
    // Read and parse the template content
    const { parseContent } = await import('./parser.js');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const ast = parseContent(templateContent);
    
    // Execute the template
    await executor.execute(ast);
    
    console.log(chalk.green(`✅ Template executed successfully`));
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download/execute template: ${error.message}`);
    } else {
      throw new Error(`Failed to download/execute template: ${String(error)}`);
    }
  } finally {
    // Cleanup: remove temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(chalk.yellow(`Warning: Could not clean up temporary directory: ${tempDir}`));
    }
  }
}

/**
 * Displays the list of templates in a formatted way
 */
export function displayTemplates(templates: TemplateInfo[]): void {
  if (templates.length === 0) {
    console.log(chalk.yellow('No templates found in the repository.'));
    return;
  }
  
  console.log(chalk.green(`\\n📋 Available templates (${templates.length}):
`));
  
  // Find the longest name for formatting
  const maxNameLength = Math.max(...templates.map(t => t.name.length));
  
  for (const template of templates) {
    const nameFormatted = template.name.padEnd(maxNameLength);
    const description = template.description || 'No description available';
    
    console.log(`  ${chalk.cyan(nameFormatted)} - ${chalk.gray(description)}`);
  }
  
  console.log(chalk.blue(`\\nUsage: gen --template=<template-name> --output=<output-directory>`));
}