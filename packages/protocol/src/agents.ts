/**
 * @fluxide/protocol — Agent System Schema
 *
 * Defines agent personas, configurations, and the AI Director.
 */

// ─── Agent Role ─────────────────────────────────────────────
export type AgentRole =
  | "director"
  | "product_manager"
  | "researcher"
  | "architect"
  | "frontend_engineer"
  | "backend_engineer"
  | "fullstack_engineer"
  | "mobile_engineer"
  | "database_engineer"
  | "ui_ux_designer"
  | "qa_engineer"
  | "security_engineer"
  | "performance_engineer"
  | "devops_engineer"
  | "documentation_engineer"
  | "code_reviewer"
  | "release_manager"
  | "custom";

// ─── Agent Status ───────────────────────────────────────────
export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "waiting_permission"
  | "waiting_input"
  | "paused"
  | "completed"
  | "failed";

// ─── Agent Configuration ────────────────────────────────────
export interface AgentConfig {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  readonly description: string;

  /** System prompt / persona instructions */
  readonly instructions: string;

  /** Preferred model (or "auto") */
  readonly model: string;

  /** Tool names this agent can use */
  readonly tools: readonly string[];

  /** Skill names this agent has loaded */
  readonly skills: readonly string[];

  /** Permission overrides for this agent */
  readonly permissions: readonly string[];

  /** Token budget per invocation */
  readonly maxTokensPerTurn: number;

  /** Maximum cost in USD per task */
  readonly maxCostPerTask: number;

  /** Timeout per tool execution (ms) */
  readonly toolTimeoutMs: number;

  /** Filesystem paths this agent can access (globs) */
  readonly allowedPaths: readonly string[];

  /** Temperature override */
  readonly temperature?: number;
}

// ─── Agent Session ──────────────────────────────────────────
export interface AgentSession {
  readonly id: string;
  readonly agentConfig: AgentConfig;
  readonly taskId?: string;
  status: AgentStatus;

  /** Structured action log for audit / replay */
  actions: AgentAction[];

  /** Files this agent has read */
  filesRead: string[];

  /** Files this agent has modified */
  filesModified: string[];

  /** Commands this agent has executed */
  commandsExecuted: string[];

  readonly startedAt: string;
  completedAt?: string;
  error?: string;
}

// ─── Agent Action (audit log entry) ─────────────────────────
export interface AgentAction {
  readonly id: string;
  readonly timestamp: string;
  readonly type:
    | "think"
    | "tool_call"
    | "tool_result"
    | "permission_request"
    | "permission_response"
    | "checkpoint"
    | "error"
    | "message";
  readonly summary: string;
  readonly details?: Record<string, unknown>;
  readonly durationMs?: number;
  readonly tokenUsage?: TokenUsage;
}

// ─── Token Usage ────────────────────────────────────────────
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
  readonly reasoningTokens?: number;
  readonly estimatedCostUsd: number;
}

// ─── Agent Team ─────────────────────────────────────────────
export interface AgentTeam {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly members: readonly AgentConfig[];
}
