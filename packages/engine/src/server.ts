/**
 * FluxIDE Engine — WebSocket Server
 *
 * The communication hub between fluxd and any client.
 * Handles UFP message routing, session management,
 * and connection lifecycle.
 */

import { createServer, type Server as HttpServer } from "node:http";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, renameSync } from "node:fs";
import { resolve, join, basename, relative, dirname, isAbsolute, sep } from "node:path";
import { exec, execFile } from "node:child_process";
import { WebSocketServer, type WebSocket } from "ws";
import { generateId } from "@fluxide/protocol";
import type {
  UFPMessage,
  ClientMessage,
  ServerMessage,
  ErrorPayload,
} from "@fluxide/protocol";
import { getDashboardHtml } from "./web/dashboard.js";
import { getDesktopIdeHtml } from "./web/desktop.js";

export interface FluxServerOptions {
  readonly port: number;
  readonly host: string;
}

export type MessageHandler = (
  clientId: string,
  message: ClientMessage
) => Promise<void>;

interface WorkspaceTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: WorkspaceTreeNode[];
}

let currentWorkspaceRoot = process.cwd();

export function setWorkspaceRoot(newRoot: string): void {
  if (existsSync(newRoot)) {
    currentWorkspaceRoot = resolve(newRoot);
  }
}

export function getWorkspaceRoot(): string {
  return currentWorkspaceRoot;
}

/** Resolve a client path only when it remains inside the active workspace. */
function resolveWorkspacePath(workspacePath: string): string {
  if (!workspacePath || typeof workspacePath !== "string") {
    throw new Error("A workspace-relative path is required.");
  }

  const root = resolve(currentWorkspaceRoot);
  const fullPath = resolve(root, workspacePath);
  const pathFromRoot = relative(root, fullPath);

  if (
    pathFromRoot === "" ||
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    throw new Error("Path must remain inside the active workspace.");
  }

  return fullPath;
}

function getWorkspaceTree(dirPath: string, depth = 0, maxDepth = 4): WorkspaceTreeNode[] {
  if (depth > maxDepth || !existsSync(dirPath)) return [];
  const nodes: WorkspaceTreeNode[] = [];
  const ignored = new Set(["node_modules", ".git", "dist", "build", "graphify-out", ".flux", ".desktop-profile"]);
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
      return a.isDirectory() ? -1 : 1;
    });
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const fullPath = join(dirPath, entry.name);
      const relPath = relative(currentWorkspaceRoot, fullPath).replace(/\\/g, "/");
      const isDir = entry.isDirectory();
      const node: WorkspaceTreeNode = {
        name: entry.name,
        path: relPath,
        isDirectory: isDir,
      };
      if (isDir && depth < maxDepth) {
        node.children = getWorkspaceTree(fullPath, depth + 1, maxDepth);
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
    console.warn(`Failed to read directory ${dirPath}:`, err);
  }
  return nodes;
}

export class FluxServer {
  private httpServer: HttpServer | null = null;
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WebSocket>();
  private handlers = new Map<string, MessageHandler>();

  constructor(private readonly options: FluxServerOptions) {}

  /**
   * Start the HTTP and WebSocket server.
   */
  async start(): Promise<void> {
    return new Promise((resolvePromise, reject) => {
      this.httpServer = createServer((req, res) => {
        const rawUrl = req.url ?? "/";
        const [url, queryStr] = rawUrl.split("?");
        const params = new URLSearchParams(queryStr ?? "");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        if (url === "/" || url === "/dashboard") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(getDashboardHtml(this.options.port));
          return;
        }

        if (url === "/desktop") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(getDesktopIdeHtml(this.options.port));
          return;
        }

        if (url === "/health" || url === "/api/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "healthy", version: "0.1.0" }));
          return;
        }

        // Workspace Open API
        if (url === "/api/workspace/open" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { path: targetPath } = JSON.parse(body);
              if (!targetPath || !existsSync(targetPath)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Directory does not exist: " + targetPath }));
                return;
              }
              currentWorkspaceRoot = resolve(targetPath);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, root: currentWorkspaceRoot }));
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Workspace Tree API
        if (url === "/api/workspace/tree") {
          const tree = getWorkspaceTree(currentWorkspaceRoot);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ root: currentWorkspaceRoot, tree }));
          return;
        }

        // File Read API
        if (url === "/api/fs/read" && req.method === "GET") {
          const relPath = params.get("path");
          if (!relPath) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing path parameter" }));
            return;
          }
          try {
            const fullPath = resolveWorkspacePath(relPath);
            if (!existsSync(fullPath)) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "File not found: " + relPath }));
              return;
            }
            const content = readFileSync(fullPath, "utf8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ path: relPath, content }));
          } catch (err: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // File Write API
        if (url === "/api/fs/write" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { path: relPath, content } = JSON.parse(body);
              if (!relPath || content === undefined) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing path or content" }));
                return;
              }
              const fullPath = resolveWorkspacePath(relPath);
              mkdirSync(dirname(fullPath), { recursive: true });
              writeFileSync(fullPath, content, "utf8");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, path: relPath }));
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // File Delete API
        if (url === "/api/fs/delete" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { path: relPath } = JSON.parse(body);
              if (!relPath) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing path" }));
                return;
              }
              const fullPath = resolveWorkspacePath(relPath);
              if (existsSync(fullPath)) {
                rmSync(fullPath, { recursive: true, force: true });
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, path: relPath }));
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // File Rename / Move API
        if (url === "/api/fs/rename" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { oldPath, newPath } = JSON.parse(body);
              if (!oldPath || !newPath) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing oldPath or newPath" }));
                return;
              }
              const fullOld = resolveWorkspacePath(oldPath);
              const fullNew = resolveWorkspacePath(newPath);
              mkdirSync(dirname(fullNew), { recursive: true });
              renameSync(fullOld, fullNew);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, oldPath, newPath }));
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Create Folder API
        if (url === "/api/fs/mkdir" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { path: relPath } = JSON.parse(body);
              if (!relPath) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing path" }));
                return;
              }
              const fullPath = resolveWorkspacePath(relPath);
              mkdirSync(fullPath, { recursive: true });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, path: relPath }));
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Terminal Exec API
        const execEnv = { ...process.env };

        if (url === "/api/terminal/exec" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { command } = JSON.parse(body);
              if (!command) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing command" }));
                return;
              }
              exec(command, { cwd: currentWorkspaceRoot, timeout: 30000, env: execEnv }, (error, stdout, stderr) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  command,
                  stdout: stdout || "",
                  stderr: stderr || (error ? error.message : ""),
                  exitCode: error ? (error.code ?? 1) : 0,
                }));
              });
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Git Status API
        if (url === "/api/git/status" && req.method === "GET") {
          exec("git status --porcelain -b", { cwd: currentWorkspaceRoot, env: execEnv }, (error, stdout) => {
            if (error) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ branch: "main", files: [], isRepo: false }));
              return;
            }
            const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
            let branch = "main";
            const files: { path: string; status: string; staged: boolean }[] = [];
            for (const line of lines) {
              if (line.startsWith("## ")) {
                branch = line.slice(3).split("...")[0].trim();
                continue;
              }
              const indexStatus = line[0];
              const workStatus = line[1];
              const filePath = line.slice(3).trim();
              const status = (indexStatus !== " " && indexStatus !== "?") ? indexStatus : workStatus;
              const staged = indexStatus !== " " && indexStatus !== "?";
              files.push({ path: filePath, status: status || "M", staged });
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ branch, files, isRepo: true }));
          });
          return;
        }

        // Git Diff API
        if (url === "/api/git/diff" && req.method === "GET") {
          const relPath = params.get("path") ?? "";
          if (!relPath) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing path" }));
            return;
          }
          let fullPath: string;
          try {
            fullPath = resolveWorkspacePath(relPath);
          } catch (err: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }

          const cleanRel = relPath.replace(/\\/g, "/");
          execFile("git", ["show", `HEAD:${cleanRel}`], { cwd: currentWorkspaceRoot, env: execEnv }, (errOriginal, originalContent) => {
            const original = errOriginal ? "" : originalContent;
            let modified = "";
            try {
              if (existsSync(fullPath)) {
                modified = readFileSync(fullPath, "utf8");
              }
            } catch {}
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ path: relPath, original, modified }));
          });
          return;
        }

        // Git Commit API
        if (url === "/api/git/commit" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { message } = JSON.parse(body);
              if (!message) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing commit message" }));
                return;
              }
              execFile("git", ["add", "-A"], { cwd: currentWorkspaceRoot, env: execEnv }, (addError, addStdout, addStderr) => {
                if (addError) {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ success: false, output: addStderr || addError.message }));
                  return;
                }

                execFile("git", ["commit", "-m", message], { cwd: currentWorkspaceRoot, env: execEnv }, (commitError, commitStdout, commitStderr) => {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({
                    success: !commitError,
                    output: commitStdout || commitStderr || addStdout,
                  }));
                });
              });
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Git Rollback API
        if (url === "/api/git/rollback" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const { path: relPath } = JSON.parse(body);
              if (!relPath) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing path" }));
                return;
              }
              const safePath = resolveWorkspacePath(relPath);
              const workspaceRelativePath = relative(currentWorkspaceRoot, safePath);
              execFile("git", ["checkout", "HEAD", "--", workspaceRelativePath], { cwd: currentWorkspaceRoot, env: execEnv }, (error, stdout, stderr) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  success: !error,
                  output: stdout || stderr,
                }));
              });
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Search in Workspace API
        if (url === "/api/search" && req.method === "GET") {
          const query = params.get("q") ?? "";
          if (!query || query.length < 2) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ results: [] }));
            return;
          }
          const results: { file: string; line: number; text: string }[] = [];
          function searchDir(dir: string, depth = 0) {
            if (depth > 4 || !existsSync(dir) || results.length >= 50) return;
            const ignored = new Set(["node_modules", ".git", "dist", "build", "graphify-out", ".flux", ".desktop-profile"]);
            try {
              const entries = readdirSync(dir, { withFileTypes: true });
              for (const e of entries) {
                if (ignored.has(e.name)) continue;
                const fp = join(dir, e.name);
                if (e.isDirectory()) {
                  searchDir(fp, depth + 1);
                } else if (e.isFile() && (fp.endsWith(".ts") || fp.endsWith(".js") || fp.endsWith(".json") || fp.endsWith(".md") || fp.endsWith(".html") || fp.endsWith(".css") || fp.endsWith(".py") || fp.endsWith(".rs"))) {
                  try {
                    const text = readFileSync(fp, "utf8");
                    if (text.includes(query)) {
                      const lines = text.split("\n");
                      lines.forEach((line, idx) => {
                        if (line.includes(query) && results.length < 50) {
                          results.push({
                            file: relative(currentWorkspaceRoot, fp).replace(/\\/g, "/"),
                            line: idx + 1,
                            text: line.trim(),
                          });
                        }
                      });
                    }
                  } catch {}
                }
              }
            } catch {}
          }
          searchDir(currentWorkspaceRoot);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ query, results }));
          return;
        }

        // AI Provider Status API
        if (url === "/api/ai/providers" && req.method === "GET") {
          const providers = [
            { id: "anthropic", name: "Anthropic Claude 3.7", configured: Boolean(process.env["ANTHROPIC_API_KEY"]) },
            { id: "openai", name: "OpenAI GPT-4o", configured: Boolean(process.env["OPENAI_API_KEY"]) },
            { id: "gemini", name: "Google Gemini 2.5 Flash", configured: Boolean(process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"]) },
            { id: "ollama", name: "Local Ollama (Offline Ready)", configured: true, local: true }
          ];
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ providers }));
          return;
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      });

      this.wss = new WebSocketServer({ server: this.httpServer });

      this.httpServer.listen(this.options.port, this.options.host, () => {
        console.log(
          `⚡ fluxd listening on ws://${this.options.host}:${this.options.port} & http://${this.options.host}:${this.options.port}/`
        );
        resolvePromise();
      });

      this.httpServer.on("error", (error) => {
        console.error("❌ FluxServer HTTP error:", error.message);
        reject(error);
      });

      this.wss.on("error", (error) => {
        console.error("❌ FluxServer WSS error:", error.message);
      });

      this.wss.on("connection", (ws, req) => {
        const clientId = generateId("client");
        this.clients.set(clientId, ws);

        console.log(
          `🔗 Client connected: ${clientId} from ${req.socket.remoteAddress ?? "unknown"}`
        );

        ws.on("message", async (data) => {
          try {
            const raw = data.toString();
            const message = JSON.parse(raw) as ClientMessage;
            await this.routeMessage(clientId, message);
          } catch (error) {
            const errMsg =
              error instanceof Error ? error.message : "Unknown parse error";
            this.sendToClient(clientId, {
              id: generateId("msg"),
              type: "error",
              payload: {
                code: "PARSE_ERROR",
                message: errMsg,
              } satisfies ErrorPayload,
              timestamp: new Date().toISOString(),
            });
          }
        });

        ws.on("close", () => {
          console.log(`🔌 Client disconnected: ${clientId}`);
          this.clients.delete(clientId);
        });

        ws.on("error", (error) => {
          console.error(`❌ Client ${clientId} error:`, error.message);
          this.clients.delete(clientId);
        });
      });
    });
  }

  /**
   * Register a handler for a specific message type.
   */
  onMessage(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Send a message to a specific client.
   */
  sendToClient(clientId: string, message: ServerMessage | UFPMessage): void {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    for (const [, ws] of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * Get count of connected clients.
   */
  get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Gracefully shut down the server.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        for (const [, ws] of this.clients) {
          ws.close(1001, "Server shutting down");
        }
        this.clients.clear();
        this.wss.close(() => {
          if (this.httpServer) {
            this.httpServer.close(() => {
              console.log("⏹️  fluxd stopped");
              resolve();
            });
          } else {
            console.log("⏹️  fluxd stopped");
            resolve();
          }
        });
      } else {
        if (this.httpServer) {
          this.httpServer.close(() => resolve());
        } else {
          resolve();
        }
      }
    });
  }

  private async routeMessage(
    clientId: string,
    message: ClientMessage
  ): Promise<void> {
    const handler = this.handlers.get(message.type);
    if (handler) {
      await handler(clientId, message);
    } else {
      console.warn(`⚠️  No handler for message type: ${message.type}`);
      this.sendToClient(clientId, {
        id: generateId("msg"),
        type: "error",
        payload: {
          code: "UNKNOWN_MESSAGE_TYPE",
          message: `No handler registered for "${message.type}"`,
        } satisfies ErrorPayload,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
