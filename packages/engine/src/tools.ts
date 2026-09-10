/**
 * FluxIDE Engine — Universal Tool Runtime
 *
 * All agent tool invocations pass through this runtime.
 * Each tool is registered with its permission requirements
 * and goes through the permission gate before execution.
 */

import { generateId } from "@fluxide/protocol";
import type {
  ToolRegistration,
  ToolInvocation,
  ToolResult,
  ToolCategory,
} from "@fluxide/protocol";
import { PermissionGate } from "./permissions.js";

export type ToolExecutor = (
  input: Record<string, unknown>
) => Promise<string>;

interface RegisteredTool {
  readonly registration: ToolRegistration;
  readonly executor: ToolExecutor;
}

export class ToolRuntime {
  private tools = new Map<string, RegisteredTool>();

  constructor(private readonly permissionGate: PermissionGate) {}

  /**
   * Register a tool with the runtime.
   */
  register(registration: ToolRegistration, executor: ToolExecutor): void {
    this.tools.set(registration.name, { registration, executor });
  }

  /**
   * Get all registered tool definitions (for model tool_use).
   */
  getToolDefinitions(): ToolRegistration[] {
    return Array.from(this.tools.values()).map((t) => t.registration);
  }

  /**
   * Get tools by category.
   */
  getToolsByCategory(category: ToolCategory): ToolRegistration[] {
    return Array.from(this.tools.values())
      .filter((t) => t.registration.category === category)
      .map((t) => t.registration);
  }

  /**
   * Execute a tool invocation, checking permissions first.
   */
  async execute(invocation: ToolInvocation): Promise<ToolResult> {
    const tool = this.tools.get(invocation.toolName);

    if (!tool) {
      return {
        invocationId: invocation.id,
        output: `Error: Unknown tool "${invocation.toolName}"`,
        isError: true,
        durationMs: 0,
        truncated: false,
      };
    }

    // ── Permission check ──────────────────────────────────
    for (const scope of tool.registration.requiredPermissions) {
      const allowed = await this.permissionGate.check(
        scope,
        invocation.agentId,
        invocation.toolName,
        invocation.input
      );

      if (!allowed) {
        return {
          invocationId: invocation.id,
          output: `Permission denied: ${scope} for tool "${invocation.toolName}"`,
          isError: true,
          durationMs: 0,
          truncated: false,
        };
      }
    }

    // ── Execute ───────────────────────────────────────────
    const startTime = performance.now();
    try {
      const output = await tool.executor(invocation.input);
      const durationMs = Math.round(performance.now() - startTime);

      // Truncate very large outputs
      const maxLength = 100_000;
      const truncated = output.length > maxLength;
      const finalOutput = truncated
        ? output.slice(0, maxLength) +
          `\n\n[Output truncated: ${output.length} chars total]`
        : output;

      return {
        invocationId: invocation.id,
        output: finalOutput,
        isError: false,
        durationMs,
        truncated,
      };
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        invocationId: invocation.id,
        output: `Error executing "${invocation.toolName}": ${message}`,
        isError: true,
        durationMs,
        truncated: false,
      };
    }
  }
}

// ─── Built-in Tool Registrations ────────────────────────────

export function createBuiltinToolRegistrations(): ToolRegistration[] {
  return [
    {
      name: "fs_read_file",
      category: "filesystem",
      description:
        "Read the contents of a file. Returns the file text content.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          startLine: { type: "number", description: "Start line (1-indexed, optional)" },
          endLine: { type: "number", description: "End line (1-indexed, optional)" },
        },
        required: ["path"],
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "fs_write_file",
      category: "filesystem",
      description:
        "Create or overwrite a file with the given content.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          content: { type: "string", description: "File content to write" },
        },
        required: ["path", "content"],
      },
      requiredPermissions: ["fs:write"],
      isDangerous: false,
      isDestructive: true,
    },
    {
      name: "fs_patch_file",
      category: "filesystem",
      description:
        "Apply a targeted text replacement to a file. Finds targetContent and replaces it with replacementContent.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          targetContent: { type: "string", description: "Exact text to find" },
          replacementContent: { type: "string", description: "Text to replace with" },
        },
        required: ["path", "targetContent", "replacementContent"],
      },
      requiredPermissions: ["fs:write"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "fs_list_dir",
      category: "filesystem",
      description:
        "List the contents of a directory, showing files and subdirectories.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to directory" },
          recursive: { type: "boolean", description: "Include subdirectories" },
        },
        required: ["path"],
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "fs_search",
      category: "filesystem",
      description:
        "Search for text patterns in files using ripgrep-style matching.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search pattern" },
          path: { type: "string", description: "Directory or file to search" },
          isRegex: { type: "boolean", description: "Treat query as regex" },
          includes: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns to filter files",
          },
        },
        required: ["query", "path"],
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "terminal_execute",
      category: "terminal",
      description:
        "Execute a shell command and return its output.",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Command to execute" },
          cwd: { type: "string", description: "Working directory" },
          timeoutMs: {
            type: "number",
            description: "Timeout in milliseconds (default: 30000)",
          },
        },
        required: ["command"],
      },
      requiredPermissions: ["shell:execute"],
      isDangerous: true,
      isDestructive: false,
    },
    {
      name: "git_status",
      category: "git",
      description: "Get the current git status of the workspace.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Repository root path" },
        },
        required: ["cwd"],
      },
      requiredPermissions: ["git:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "git_diff",
      category: "git",
      description: "Get the git diff for staged or unstaged changes.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Repository root path" },
          staged: { type: "boolean", description: "Show staged changes only" },
          file: { type: "string", description: "Specific file to diff" },
        },
        required: ["cwd"],
      },
      requiredPermissions: ["git:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "git_commit",
      category: "git",
      description: "Stage all changes and create a commit.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Repository root path" },
          message: { type: "string", description: "Commit message" },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Files to stage (default: all)",
          },
        },
        required: ["cwd", "message"],
      },
      requiredPermissions: ["git:write"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "web_search",
      category: "search",
      description: "Search the web for information.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
      requiredPermissions: ["net:request"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "brain_query",
      category: "intelligence",
      description: "Query the Project Brain knowledge graph for symbols, files, dependencies, or impact analysis.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Symbol name, file path, or query term" },
          type: {
            type: "string",
            enum: ["symbol", "file", "dependency", "impact", "search"],
            description: "Query type (e.g. 'impact' to see what depends on a function/file)",
          },
          limit: { type: "number", description: "Maximum results to return" },
        },
        required: ["query"],
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "brain_index",
      category: "intelligence",
      description: "Trigger a fresh AST scan and update of the Project Brain knowledge graph.",
      inputSchema: {
        type: "object",
        properties: {},
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "memory_store",
      category: "intelligence",
      description: "Store a persistent convention, decision, preference, or architectural rule into Project or User Memory.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Descriptive key for the memory" },
          content: { type: "string", description: "Memory content or rule" },
          scope: { type: "string", enum: ["user", "project", "task"], description: "Memory tier" },
          tags: { type: "array", items: { type: "string" }, description: "Associated tags" },
        },
        required: ["key", "content"],
      },
      requiredPermissions: ["fs:write"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "memory_retrieve",
      category: "intelligence",
      description: "Retrieve stored memories, rules, and conventions matching a query or tags.",
      inputSchema: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search string" },
          scope: { type: "string", enum: ["user", "project", "task"], description: "Filter by scope" },
          tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
        },
      },
      requiredPermissions: ["fs:read"],
      isDangerous: false,
      isDestructive: false,
    },
    {
      name: "workspace_verify",
      category: "verification",
      description: "Run automated tests, typechecks, and linters on the workspace to verify changes and ensure correctness.",
      inputSchema: {
        type: "object",
        properties: {
          strategies: {
            type: "array",
            items: { type: "string", enum: ["typecheck", "test", "lint"] },
            description: "Verification strategies to run",
          },
          customCommand: { type: "string", description: "Optional custom command to run" },
        },
      },
      requiredPermissions: ["shell:execute"],
      isDangerous: false,
      isDestructive: false,
    },
  ];
}
