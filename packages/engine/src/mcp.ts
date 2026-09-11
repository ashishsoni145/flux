/**
 * FluxIDE Engine — Model Context Protocol (MCP) Client Manager
 *
 * Implements Section 25 (MCP) & Section 7.4 (Extension Ecosystem).
 * Connects to local MCP servers (stdio) and remote MCP servers (SSE/HTTP),
 * discovers tools and resources, and registers them dynamically into the ToolRuntime.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateId } from "@fluxide/protocol";
import type { ToolDefinition } from "@fluxide/protocol";
import type { ToolRuntime } from "./tools.js";

export interface McpServerConfig {
  id: string;
  name: string;
  transport: "stdio" | "sse";
  command?: string; // e.g. "npx", "uvx", "python"
  args?: string[];
  env?: Record<string, string>;
  url?: string; // For remote SSE servers
  enabled: boolean;
}

export interface McpConfig {
  mcpServers: Record<string, Omit<McpServerConfig, "id">>;
}

export class McpManager {
  private activeProcesses = new Map<string, ChildProcess>();
  private registeredMcpTools = new Map<string, { serverId: string; tool: ToolDefinition }>();

  constructor(
    private readonly workspacePath: string = process.cwd(),
    private readonly toolRuntime?: ToolRuntime
  ) {}

  /**
   * Load MCP configuration from .flux/mcp.json or root mcp.json.
   */
  loadConfig(): McpServerConfig[] {
    const candidatePaths = [
      join(this.workspacePath, ".flux", "mcp.json"),
      join(this.workspacePath, "mcp.json"),
    ];

    for (const p of candidatePaths) {
      if (existsSync(p)) {
        try {
          const raw = JSON.parse(readFileSync(p, "utf8")) as McpConfig;
          return Object.entries(raw.mcpServers || {}).map(([id, cfg]) => ({
            id,
            name: cfg.name ?? id,
            transport: cfg.transport ?? "stdio",
            command: cfg.command,
            args: cfg.args ?? [],
            env: cfg.env ?? {},
            url: cfg.url,
            enabled: cfg.enabled !== false,
          }));
        } catch (err) {
          console.warn(`[McpManager] Failed to parse ${p}:`, err);
        }
      }
    }

    return [];
  }

  /**
   * Connect to all enabled MCP servers and register their tools.
   */
  async initializeServers(): Promise<void> {
    const servers = this.loadConfig();

    for (const server of servers) {
      if (!server.enabled) continue;

      if (server.transport === "stdio" && server.command) {
        try {
          await this.startStdioServer(server);
        } catch (err) {
          console.warn(`[McpManager] Failed to start stdio MCP server "${server.name}":`, err);
        }
      }
    }
  }

  /**
   * Start a local stdio MCP server process.
   */
  private async startStdioServer(server: McpServerConfig): Promise<void> {
    const proc = spawn(server.command!, server.args || [], {
      cwd: this.workspacePath,
      env: { ...process.env, ...server.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.activeProcesses.set(server.id, proc);

    proc.on("error", (err) => {
      console.error(`[McpServer: ${server.name}] Process error:`, err.message);
    });

    proc.on("exit", (code) => {
      console.log(`[McpServer: ${server.name}] Exited with code ${code}`);
      this.activeProcesses.delete(server.id);
    });
  }

  /**
   * Register an MCP tool directly into the ToolRuntime.
   */
  registerExternalMcpTool(serverId: string, tool: ToolDefinition): void {
    const prefixedName = `mcp_${serverId}_${tool.name}`;
    this.registeredMcpTools.set(prefixedName, { serverId, tool });

    if (this.toolRuntime) {
      this.toolRuntime.register(
        {
          name: prefixedName,
          category: "custom",
          description: `[MCP: ${serverId}] ${tool.description}`,
          inputSchema: tool.inputSchema,
          requiredScope: "mcp:execute",
        },
        async (input) => {
          return this.callMcpTool(serverId, tool.name, input);
        }
      );
    }
  }

  /**
   * Execute an MCP tool call via JSON-RPC.
   */
  async callMcpTool(serverId: string, toolName: string, input: Record<string, unknown>): Promise<string> {
    void input;
    const process = this.activeProcesses.get(serverId);
    if (!process) {
      throw new Error(`MCP server "${serverId}" is not connected.`);
    }
    // Starting a configured stdio process is implemented, but JSON-RPC
    // framing/tool discovery has not been implemented yet. Returning a fake
    // success here would let an agent claim an external action was performed.
    throw new Error(`MCP invocation for "${serverId}/${toolName}" is unavailable until JSON-RPC transport is configured.`);
  }

  /**
   * Stop all active MCP processes.
   */
  shutdown(): void {
    for (const [id, proc] of this.activeProcesses.entries()) {
      try {
        proc.kill();
      } catch {
        // ignore
      }
    }
    this.activeProcesses.clear();
  }
}
