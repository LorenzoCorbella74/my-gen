import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import { AstNode, CommandContext, CommandResult } from "./types.js";

export async function handleFill(node: AstNode, ctx: CommandContext): Promise<CommandResult> {
    try {
        const filePath = ctx.context.interpolate(node.payload);
        console.log(chalk.gray(`[Fill] ${filePath}`));

        if (!filePath) {
            throw new Error('Fill command requires a file path');
        }

        // The content should be stored in the node's content property
        const fillNode = node as any; // Cast to access content property
        if (!fillNode.content || fillNode.content.length === 0) {
            throw new Error('Fill command requires content between quote delimiters');
        }

        // Join content lines with newlines
        const content = fillNode.content.join('\n');
        const interpolatedContent = ctx.context.interpolate(content);

        // @fill file according to globalshell.pwd
        const finalPath = ctx.resolvePath(filePath);

        // Check if the target path is already a directory
        try {
            const stats = await fs.stat(finalPath);
            if (stats.isDirectory()) {
                throw new Error(`Cannot write to '${finalPath}': path is a directory`);
            }
        } catch (err: any) {
            // If file doesn't exist, that's expected - continue
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        // Create directory if it doesn't exist
        const dir = path.dirname(finalPath);
        await fs.mkdir(dir, { recursive: true });

        // Write the content to the file
        await fs.writeFile(finalPath, interpolatedContent, 'utf-8');

        return {
            success: `File filled: ${filePath}`
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to write content: ${error.message}`);
        }
        throw error;
    }
}