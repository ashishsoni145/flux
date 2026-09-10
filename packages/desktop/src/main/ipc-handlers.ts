/**
 * FluxIDE Desktop — Native IPC Handlers
 *
 * Implements filesystem, workspace tree scanning, terminal PTY,
 * and dialog operations for the renderer process.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, rmSync, renameSync, existsSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { TerminalSession } from "./pty-terminal.js";
import type { DaemonSupervisor } from "./daemon-supervisor.js";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export class IpcService {
  private activeTerminals = new Map<string, TerminalSession>();

  constructor(
    private readonly daemonSupervisor: DaemonSupervisor,
    private currentWorkspace: string = process.cwd()
  ) {}

  /**
   * Set current workspace folder.
   */
  setWorkspace(folderPath: string): void {
    if (existsSync(folderPath)) {
      this.currentWorkspace = folderPath;
    }
  }

  getWorkspace(): string {
    return this.currentWorkspace;
  }

  /**
   * Recursively scan a folder tree (up to maxDepth) ignoring node_modules, .git, and build artifacts.
   */
  readDirectoryTree(dirPath = this.currentWorkspace, depth = 0, maxDepth = 4): FileNode[] {
    if (depth > maxDepth || !existsSync(dirPath)) return [];

    const nodes: FileNode[] = [];
    const ignored = new Set(["node_modules", ".git", "dist", "build", "graphify-out", ".flux"]);

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      // Sort: directories first, then alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
        return a.isDirectory() ? -1 : 1;
      });

      for (const entry of entries) {
        if (ignored.has(entry.name)) continue;

        const fullPath = join(dirPath, entry.name);
        const isDir = entry.isDirectory();

        const node: FileNode = {
          name: entry.name,
          path: fullPath,
          isDirectory: isDir,
        };

        if (isDir && depth < maxDepth) {
          node.children = this.readDirectoryTree(fullPath, depth + 1, maxDepth);
        } else if (!isDir) {
          try {
            node.size = statSync(fullPath).size;
          } catch {
            // ignore
          }
        }

        nodes.push(node);
      }
    } catch (err) {
      console.warn(`[IpcService] Failed to read ${dirPath}:`, err);
    }

    return nodes;
  }

  /**
   * Read file content.
   */
  readFile(filePath: string): string {
    return readFileSync(filePath, "utf8");
  }

  /**
   * Write file content.
   */
  writeFile(filePath: string, content: string): void {
    writeFileSync(filePath, content, "utf8");
  }

  /**
   * Create new file.
   */
  createFile(filePath: string): void {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, "", "utf8");
    }
  }

  /**
   * Create new directory.
   */
  createDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Delete file or directory.
   */
  deletePath(targetPath: string): void {
    if (!existsSync(targetPath)) return;
    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      rmSync(targetPath, { recursive: true, force: true });
    } else {
      unlinkSync(targetPath);
    }
  }

  /**
   * Rename file or directory.
   */
  renamePath(oldPath: string, newPath: string): void {
    renameSync(oldPath, newPath);
  }

  /**
   * Terminal creation.
   */
  createTerminal(id: string, onData: (data: string) => void): void {
    const session = new TerminalSession(id, this.currentWorkspace);
    session.on("data", onData);
    session.start();
    this.activeTerminals.set(id, session);
  }

  writeTerminal(id: string, data: string): void {
    const session = this.activeTerminals.get(id);
    if (session) {
      session.write(data);
    }
  }

  killTerminal(id: string): void {
    const session = this.activeTerminals.get(id);
    if (session) {
      session.kill();
      this.activeTerminals.delete(id);
    }
  }

  async getDaemonStatus() {
    return this.daemonSupervisor.ensureDaemon(this.currentWorkspace);
  }
}
