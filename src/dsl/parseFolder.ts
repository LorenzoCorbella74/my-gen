import * as fs from 'node:fs/promises';
import * as path from 'path';

/**
 * Recursively reads files from a folder and returns an object
 * with keys as relative paths and values as file contents.
 *
 * @param dir - Path of the starting folder
 * @param exclude - Array of file names or extensions to exclude
 * @returns An object with a 'templates' property containing { "filePath": "content", ... }[]
 */
export async function loadFolderAsObject(dir: string, exclude: string[] = []) {
    const result: { [key: string]: string } = {};

    async function walk(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relativePath = path.relative(dir, fullPath);

            // Se è una cartella → ricorsione
            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }

            // Esclusioni: per nome o estensione
            const ext = path.extname(entry.name);
            if (
                exclude.includes(entry.name) ||
                exclude.includes(ext) ||
                exclude.some(str => relativePath.includes(str))) {
                continue;
            }

            // Leggo contenuto come stringa con gestione errori
            try {
                const content = await fs.readFile(fullPath, "utf8");
                result[relativePath] = content;
            } catch (error) {
                console.warn(`Impossibile leggere il file ${fullPath}:`, error);
                // Opzionalmente puoi saltare il file o usare un contenuto di default
                result[relativePath] = `[Error reading file: ${fullPath}]`;
            }
        }
    }

    await walk(dir);
    return { templates: result };
}
