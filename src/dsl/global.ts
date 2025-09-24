// Global Variables Manager
// This file manages persistent global variables stored in .global.json

import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";
import { Context } from "./context.js";
import { fileURLToPath } from 'url';

export class GlobalContext {
  private globalFilePath: string;

  constructor() {
    // Get the directory of this module file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Store .global.json in the src/dsl directory (persistent with the library)
    this.globalFilePath = path.join(__dirname, '.global.json');
  }

  /**
   * Load global variables from .global.json file
   */
  async loadGlobalVariables(): Promise<Record<string, any>> {
    try {
      const content = await fs.readFile(this.globalFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {}; // File doesn't exist, return empty object
      }
      throw error;
    }
  }

  /**
   * Save global variables to .global.json file
   */
  private async saveGlobalVariables(globals: Record<string, any>): Promise<void> {
    const content = JSON.stringify(globals, null, 2);
    await fs.writeFile(this.globalFilePath, content, 'utf-8');
  }

  /**
   * Set a global variable and save to file
   */
  async set(key: string, value: any): Promise<void> {
    const globalVars = await this.loadGlobalVariables();
    globalVars[key] = value;
    await this.saveGlobalVariables(globalVars);
  }

  /**
   * Get a specific global variable
   */
  async get(key: string): Promise<any> {
    const globalVars = await this.loadGlobalVariables();
    return globalVars[key];
  }

  /**
   * Check if a global variable exists
   */
  async has(key: string): Promise<boolean> {
    const globalVars = await this.loadGlobalVariables();
    return key in globalVars;
  }

  /**
   * Delete a global variable
   */
  async erase(key: string): Promise<boolean> {
    const globalVars = await this.loadGlobalVariables();
    if (key in globalVars) {
      delete globalVars[key];
      await this.saveGlobalVariables(globalVars);
      return true;
    }
    return false;
  }

  /**
   * Merge global variables into the current context
   */
  mergeGlobalVariablesIntoContext(globalVars: Record<string, any>, context: Context): void {
    for (const [key, value] of Object.entries(globalVars)) {
      context.set(key, value);
    }
  }

  /**
   * Initialize global variables by loading them into the current context
   */
  async initializeGlobalVariables(context: Context): Promise<void> {
    try {
      const globalVars = await this.loadGlobalVariables();
      this.mergeGlobalVariablesIntoContext(globalVars, context);
      if (Object.keys(globalVars).length > 0) {
        console.log(chalk.cyan(`[GLOBAL] Loaded ${Object.keys(globalVars).length} global variables from ${this.globalFilePath}`));
      }
    } catch (error) {
      // Ignore errors during initialization (file might not exist yet)
    }
  }

  /**
   * Update context with all global variables after a change
   */
  async syncContextWithGlobals(context: Context): Promise<void> {
    const globalVars = await this.loadGlobalVariables();
    this.mergeGlobalVariablesIntoContext(globalVars, context);
  }


  /**
   * Clear all global variables
   */
  async clear(): Promise<void> {
    await this.saveGlobalVariables({});
  }
}