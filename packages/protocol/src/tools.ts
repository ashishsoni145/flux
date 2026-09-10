/**
 * @fluxide/protocol — Tool Runtime Schema
 *
 * Defines the Universal Tool Runtime interface that all agents
 * interact with. Each tool call passes through the permission gate.
 */

// ─── Tool Category ──────────────────────────────────────────
export type ToolCategory =
  | "filesystem"
  | "terminal"
  | "git"
  | "browser"
  | "database"
  | "api"
  | "mcp"
  | "search"
  | "deployment"
  | "documentation";

// ─── Tool Registration ──────────────────────────────────────
export interface ToolRegistration {
  readonly name: string;
  readonly category: ToolCategory;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly requiredPermissions: readonly string[];
  readonly isDangerous: boolean;
  readonly isDestructive: boolean;
}

// ─── Tool Invocation ────────────────────────────────────────
export interface ToolInvocation {
  readonly id: string;
  readonly toolName: string;
  readonly input: Record<string, unknown>;
  readonly agentId: string;
  readonly taskId?: string;
  readonly timestamp: string;
}

// ─── Tool Result ────────────────────────────────────────────
export interface ToolResult {
  readonly invocationId: string;
  readonly output: string;
  readonly isError: boolean;
  readonly durationMs: number;
  readonly truncated: boolean;
}
