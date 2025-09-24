import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import { AstNode } from "../parser.js";
import { CommandContext } from "./types.js";


/**
 * Helper method to get nested values from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

/**
 * Helper method to interpolate a string with a given context
 */
function interpolateString(template: string, context: Record<string, any>): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
        const value = getNestedValue(context, key.trim());
        return value !== undefined ? String(value) : match;
    });
}

export async function handleCompile(node: AstNode, ctx: CommandContext): Promise<void> {
    const templatePath = ctx.context.interpolate(node.payload.trim());

    // Load the template.json file
    let configData: any;
    try {
        const configContent = await fs.readFile(templatePath, 'utf8');
        configData = JSON.parse(configContent);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load template file "${templatePath}": ${message}`);
    }

    // Check if templates property exists
    if (!configData.templates || typeof configData.templates !== 'object') {
        throw new Error(`Template file "${templatePath}" must contain a "templates" property with an object value`);
    }

    // Create a context with the config data for interpolation
    const templateContext = { ...ctx.context.getAllVariables(), ...configData };

    console.log(chalk.blue(`[COMPILE] Processing template file: ${templatePath}`));

    // Loop over each template and create files/folders
    for (const [filePath, content] of Object.entries(configData.templates)) {
        if (typeof content !== 'string') {
            console.warn(chalk.yellow(`[COMPILE] Skipping non-string template: ${filePath}`));
            continue;
        }

        // Interpolate the file path
        const finalFilePath = ctx.resolvePath(interpolateString(filePath, templateContext));

        // Create directory if it doesn't exist
        const dir = path.dirname(finalFilePath);
        await fs.mkdir(dir, { recursive: true });

        // Interpolate the content
        const finalContent = interpolateString(content as string, templateContext);

        // Write the file
        await fs.writeFile(finalFilePath, finalContent);
        console.log(chalk.green(`[COMPILE] Created: ${finalFilePath}`));
    }

    console.log(chalk.blue(`[COMPILE] Template compilation completed`));
}