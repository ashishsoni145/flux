/**
 * FluxIDE Engine — Built-in Filesystem Tools
 *
 * Concrete implementations of filesystem tool executors:
 * read, write, patch, list, and search.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { existsSync } from "node:fs";

/**
 * Read the contents of a file with optional line range.
 */
export async function fsReadFile(
  input: Record<string, unknown>
): Promise<string> {
  const filePath = input["path"] as string;
  if (!filePath) throw new Error("Missing required parameter: path");

  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  const startLine = (input["startLine"] as number | undefined) ?? 1;
  const endLine = (input["endLine"] as number | undefined) ?? lines.length;

  const sliced = lines.slice(startLine - 1, endLine);
  const numbered = sliced
    .map((line, i) => `${startLine + i}: ${line}`)
    .join("\n");

  return `File: ${filePath} (${lines.length} lines)\n\n${numbered}`;
}

/**
 * Write content to a file, creating directories if needed.
 */
export async function fsWriteFile(
  input: Record<string, unknown>
): Promise<string> {
  const filePath = input["path"] as string;
  const content = input["content"] as string;
  if (!filePath) throw new Error("Missing required parameter: path");
  if (content === undefined) throw new Error("Missing required parameter: content");

  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf-8");

  const lineCount = content.split("\n").length;
  return `✅ Written ${lineCount} lines to ${filePath}`;
}

/**
 * Apply a targeted text replacement to a file.
 */
export async function fsPatchFile(
  input: Record<string, unknown>
): Promise<string> {
  const filePath = input["path"] as string;
  const target = input["targetContent"] as string;
  const replacement = input["replacementContent"] as string;

  if (!filePath) throw new Error("Missing required parameter: path");
  if (!target) throw new Error("Missing required parameter: targetContent");
  if (replacement === undefined)
    throw new Error("Missing required parameter: replacementContent");

  const content = await readFile(filePath, "utf-8");

  if (!content.includes(target)) {
    throw new Error(
      `Target content not found in ${filePath}. Ensure the text matches exactly.`
    );
  }

  const occurrences = content.split(target).length - 1;
  if (occurrences > 1) {
    throw new Error(
      `Target content found ${occurrences} times in ${filePath}. Must be unique for safe patching.`
    );
  }

  const patched = content.replace(target, replacement);
  await writeFile(filePath, patched, "utf-8");

  return `✅ Patched ${filePath} (1 replacement applied)`;
}

/**
 * List directory contents.
 */
export async function fsListDir(
  input: Record<string, unknown>
): Promise<string> {
  const dirPath = input["path"] as string;
  const recursive = (input["recursive"] as boolean) ?? false;
  if (!dirPath) throw new Error("Missing required parameter: path");

  const entries = await readdir(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const childCount = recursive
        ? (await readdir(fullPath, { recursive: true })).length
        : 0;
      results.push(
        `📁 ${entry.name}/` + (recursive ? ` (${childCount} items)` : "")
      );

      if (recursive) {
        const subResult = await fsListDir({
          path: fullPath,
          recursive: true,
        });
        const indented = subResult
          .split("\n")
          .map((l) => `  ${l}`)
          .join("\n");
        results.push(indented);
      }
    } else {
      const fileStat = await stat(fullPath);
      const sizeKb = (fileStat.size / 1024).toFixed(1);
      results.push(`📄 ${entry.name} (${sizeKb} KB)`);
    }
  }

  return `Directory: ${dirPath}\n\n${results.join("\n")}`;
}

/**
 * Search for text patterns in files.
 * Uses a basic recursive search (ripgrep integration in future).
 */
export async function fsSearch(
  input: Record<string, unknown>
): Promise<string> {
  const query = input["query"] as string;
  const searchPath = input["path"] as string;
  if (!query) throw new Error("Missing required parameter: query");
  if (!searchPath) throw new Error("Missing required parameter: path");

  const results: string[] = [];
  const maxResults = 50;

  async function searchDir(dir: string): Promise<void> {
    if (results.length >= maxResults) return;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = join(dir, entry.name);

      // Skip common non-text directories
      if (
        entry.isDirectory() &&
        !["node_modules", ".git", "dist", ".turbo", "coverage"].includes(
          entry.name
        )
      ) {
        await searchDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = await readFile(fullPath, "utf-8");
          const lines = content.split("\n");

          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) break;
            const line = lines[i]!;
            if (line.includes(query)) {
              const rel = relative(searchPath, fullPath);
              results.push(`${rel}:${i + 1}: ${line.trim()}`);
            }
          }
        } catch {
          // Skip binary or unreadable files
        }
      }
    }
  }

  await searchDir(searchPath);

  if (results.length === 0) {
    return `No matches found for "${query}" in ${searchPath}`;
  }

  return `Found ${results.length} match${results.length === 1 ? "" : "es"} for "${query}":\n\n${results.join("\n")}`;
}
