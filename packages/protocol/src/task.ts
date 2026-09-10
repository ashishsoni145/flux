/**
 * @fluxide/protocol — Task Graph Schema
 *
 * Defines the DAG-based task system used by the AI Director
 * to decompose user intent into executable, trackable work units.
 */

// ─── Task Status ────────────────────────────────────────────
export type TaskStatus =
  | "backlog"
  | "planned"
  | "ready"
  | "running"
  | "waiting"
  | "review"
  | "failed"
  | "completed";

// ─── Task Priority ──────────────────────────────────────────
export type TaskPriority = "critical" | "high" | "medium" | "low";

// ─── Task Type ──────────────────────────────────────────────
export type TaskType =
  | "research"
  | "architecture"
  | "implementation"
  | "testing"
  | "review"
  | "security"
  | "performance"
  | "documentation"
  | "deployment"
  | "debugging"
  | "refactoring"
  | "design";

// ─── Acceptance Criterion ───────────────────────────────────
export interface AcceptanceCriterion {
  readonly id: string;
  readonly description: string;
  readonly type: "automated" | "manual";
  readonly verificationCommand?: string;
  readonly satisfied: boolean;
}

// ─── Task Artifact ──────────────────────────────────────────
export interface TaskArtifact {
  readonly id: string;
  readonly type: "file" | "diff" | "screenshot" | "log" | "report" | "diagram";
  readonly path: string;
  readonly description: string;
  readonly createdAt: string;
}

// ─── Task Budget ────────────────────────────────────────────
export interface TaskBudget {
  readonly maxTokens: number;
  readonly maxCostUsd: number;
  readonly maxRetries: number;
  readonly maxDurationMs: number;
  usedTokens: number;
  usedCostUsd: number;
  retries: number;
  elapsedMs: number;
}

// ─── Task Node ──────────────────────────────────────────────
export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: TaskType;
  readonly priority: TaskPriority;
  status: TaskStatus;

  /** Agent persona assigned to this task */
  readonly assignedAgent?: string;

  /** Model to use (or "auto" for Director routing) */
  readonly model?: string;

  /** IDs of tasks that must complete before this one can start */
  readonly dependencies: readonly string[];

  /** Files this task is expected to read */
  readonly inputFiles: readonly string[];

  /** Files this task is expected to create or modify */
  readonly outputFiles: string[];

  /** Acceptance criteria for verification */
  readonly acceptanceCriteria: AcceptanceCriterion[];

  /** Required permission scopes */
  readonly requiredPermissions: readonly string[];

  /** Execution budget */
  readonly budget: TaskBudget;

  /** Artifacts produced by this task */
  artifacts: TaskArtifact[];

  /** Error message if failed */
  error?: string;

  /** Checkpoint ID created before execution */
  checkpointId?: string;

  readonly createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ─── Task Graph ─────────────────────────────────────────────
export interface TaskGraph {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tasks: Task[];
  readonly createdAt: string;
  status: "planning" | "ready" | "running" | "paused" | "completed" | "failed";
}
