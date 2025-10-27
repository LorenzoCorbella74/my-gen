import * as fs from 'node:fs/promises';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import degit from 'degit';
import { parseContent } from './parser.js';

const REPO_OWNER = 'LorenzoCorbella74';
const REPO_NAME = 'my-gen';
const BRANCH = 'main';
const TEMPLATES_PATH = 'templates';

// Cache configuration
const CACHE_DIR = path.join(os.homedir(), '.gen', 'templates');
const CACHE_INFO_FILE = path.join(CACHE_DIR, '.cache-info.json');
const CACHE_VALIDITY_HOURS = 24; // Cache validity period

interface TemplateInfo {
  name: string;
  filename: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  requires?: string[];
  links?: string[];
  usage?: string;
  platform?: string; // WIN, MAC
  status?: 'stable' | "not_stable"
}

interface CacheInfo {
  lastUpdated: string;
  repoPath: string;
  branch: string;
  templateCount: number;
}

/**
 * Checks if cache exists and is valid
 */
async function isCacheValid(): Promise<boolean> {
  try {
    const cacheInfo = await fs.readFile(CACHE_INFO_FILE, 'utf-8');
    const info: CacheInfo = JSON.parse(cacheInfo);
    
    const lastUpdated = new Date(info.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < CACHE_VALIDITY_HOURS;
  } catch (error) {
    return false;
  }
}

/**
 * Ensures cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create cache directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Downloads templates using degit and updates cache
 */
async function updateCache(): Promise<void> {
  await ensureCacheDir();
  
  console.log(chalk.blue('🔄 Updating template cache...'));
  
  try {
    // Use degit to download templates folder
    const repoPath = `${REPO_OWNER}/${REPO_NAME}/${TEMPLATES_PATH}#${BRANCH}`;
    const emitter = degit(repoPath);
    
    // Create temporary directory for download
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gen-cache-'));
    
    try {
      await emitter.clone(tempDir);
      
      // Clear existing cache
      try {
        const files = await fs.readdir(CACHE_DIR);
        for (const file of files) {
          if (file !== '.cache-info.json') {
            await fs.rm(path.join(CACHE_DIR, file), { force: true });
          }
        }
      } catch (error) {
        // Cache directory might be empty, that's fine
      }
      
      // Copy templates to cache
      const tempFiles = await fs.readdir(tempDir);
      const templateFiles = tempFiles.filter(file => file.endsWith('.gen'));
      
      for (const file of templateFiles) {
        const sourcePath = path.join(tempDir, file);
        const destPath = path.join(CACHE_DIR, file);
        await fs.copyFile(sourcePath, destPath);
      }
      
      // Update cache info
      const cacheInfo: CacheInfo = {
        lastUpdated: new Date().toISOString(),
        repoPath,
        branch: BRANCH,
        templateCount: templateFiles.length
      };
      
      await fs.writeFile(CACHE_INFO_FILE, JSON.stringify(cacheInfo, null, 2));
      
      console.log(chalk.green(`✅ Cache updated with ${templateFiles.length} templates`));
      
    } finally {
      // Cleanup temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not clean up temp directory: ${tempDir}`));
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to update cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads templates from local cache
 */
async function readTemplatesFromCache(): Promise<TemplateInfo[]> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const templateFiles = files.filter(file => file.endsWith('.gen'));
    
    const templates: TemplateInfo[] = [];
    
    for (const filename of templateFiles) {
      try {
        const filePath = path.join(CACHE_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const templateInfo = extractTemplateInfoFromContent(content, filename);
        
        templates.push(templateInfo);
      } catch (error) {
        // If we can't read a file, still include it without metadata
        templates.push({
          name: filename.replace('.gen', ''),
          filename,
          description: 'Error reading template metadata'
        });
      }
    }
    
    return templates;
  } catch (error) {
    throw new Error(`Failed to read templates from cache: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches the list of templates using cache when possible
 */
export async function listTemplates(forceRefresh: boolean = false): Promise<TemplateInfo[]> {
  try {
    // Check if we need to update cache
    if (forceRefresh || !(await isCacheValid())) {
      await updateCache();
    } else {
      console.log(chalk.blue('📋 Reading templates from cache...'));
    }
    
    // Read templates from cache
    const templates = await readTemplatesFromCache();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found in cache. Trying to refresh...'));
      await updateCache();
      return await readTemplatesFromCache();
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
 * Extracts comprehensive template information from content using Front Matter metadata
 */
function extractTemplateInfoFromContent(content: string, filename: string): TemplateInfo {
  const name = filename.replace('.gen', '');
  
  try {
    const parseResult = parseContent(content);
    
    // Use metadata if available
    if (parseResult.metadata && Object.keys(parseResult.metadata).length > 0) {
      const metadata = parseResult.metadata;
      
      return {
        name,
        filename,
        description: metadata.description || 'No description available',
        author: metadata.author,
        version: metadata.version,
        tags: metadata.tags,
        requires: metadata.requires,
        links: metadata.links
      };
    }
    
    // Fallback to first comment line for backward compatibility
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') && !trimmed.startsWith('#!/')) {
        return {
          name,
          filename,
          description: trimmed.substring(1).trim()
        };
      }
    }
    
    return {
      name,
      filename,
      description: 'No description available'
    };
  } catch (error) {
    return {
      name,
      filename,
      description: 'Error parsing template metadata'
    };
  }
}

/**
 * Downloads and executes a template, using cache when available
 */
export async function downloadAndExecuteTemplate(
  templateName: string,
  outputDir: string,
  executor: any, // Will be properly typed later
  context: any   // Will be properly typed later
): Promise<void> {
  // Add .gen extension if not present
  const filename = templateName.endsWith('.gen') ? templateName : `${templateName}.gen`;
  
  try {
    // First, try to use cached template
    const cachedTemplatePath = path.join(CACHE_DIR, filename);
    
    let templateContent: string;
    
    try {
      // Check if template exists in cache
      await fs.access(cachedTemplatePath);
      console.log(chalk.blue(`📦 Using cached template: ${templateName}...`));
      templateContent = await fs.readFile(cachedTemplatePath, 'utf-8');
    } catch (error) {
      // Template not in cache, download it
      console.log(chalk.blue(`📦 Downloading template: ${templateName}...`));
      
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gen-template-'));
      
      try {
        // Use degit to download the templates folder
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
        
        templateContent = await fs.readFile(templatePath, 'utf-8');
        console.log(chalk.green(`✅ Template downloaded successfully`));
        
      } finally {
        // Cleanup: remove temporary directory
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn(chalk.yellow(`Warning: Could not clean up temporary directory: ${tempDir}`));
        }
      }
    }
    
    console.log(chalk.blue(`🚀 Executing template: ${filename}...`));
    
    // Parse and execute the template
    const parseResult = parseContent(templateContent);
    
    // Execute the template with new ParseResult structure
    await executor.execute(parseResult);
    
    console.log(chalk.green(`✅ Template executed successfully`));
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download/execute template: ${error.message}`);
    } else {
      throw new Error(`Failed to download/execute template: ${String(error)}`);
    }
  }
}

/**
 * Displays the list of templates in a formatted way with enhanced metadata
 */
export function displayTemplates(templates: TemplateInfo[]): void {
  if (templates.length === 0) {
    console.log(chalk.yellow('No templates found in the repository.'));
    return;
  }
  
  console.log(chalk.green(`📋 Available templates (${templates.length}):\n`));
  
  // Find the longest name for formatting
  const maxNameLength = Math.max(...templates.map(t => t.name.length));
  
  for (const template of templates) {
    const nameFormatted = template.name.padEnd(maxNameLength);
    const description = template.description || 'No description available';
    
    console.log(`  ${chalk.cyan(nameFormatted)} - ${chalk.gray(description)}`);
  }
  
  console.log(chalk.blue(`Usage: gen --template=<template-name> --output=<output-directory>`));
}