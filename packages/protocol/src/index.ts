/**
 * @fluxide/protocol
 *
 * Public API — all shared types, schemas, and protocol definitions
 * for the FluxIDE AI Software Engineering Platform.
 */

// ─── Task System ────────────────────────────────────────────
export type {
  TaskStatus,
  TaskPriority,
  TaskType,
  AcceptanceCriterion,
  TaskArtifact,
  TaskBudget,
  Task,
  TaskGraph,
} from "./task.js";

// ─── Permission System ─────────────────────────────────────
export type {
  PermissionScope,
  PermissionPolicy,
  PermissionRule,
  PermissionRequest,
  PermissionResponse,
  PermissionConfig,
} from "./permissions.js";

// ─── Agent System ───────────────────────────────────────────
export type {
  AgentRole,
  AgentStatus,
  AgentConfig,
  AgentSession,
  AgentAction,
  TokenUsage,
  AgentTeam,
} from "./agents.js";

// ─── Model Gateway ──────────────────────────────────────────
export type {
  ModelProvider,
  ModelCapability,
  ModelEntry,
  ProviderConfig,
  ModelRoutingRule,
  MessageRole,
  ChatMessage,
  MessageContent,
  StreamChunk,
  CompletionRequest,
  ToolDefinition,
  CompletionResponse,
  ToolCall,
} from "./models.js";

// ─── Project Brain ──────────────────────────────────────────
export type {
  BrainNodeType,
  BrainEdgeType,
  BrainNode,
  BrainEdge,
  BrainQuery,
  BrainQueryResult,
  ContextReferenceType,
  ContextReference,
  ContextItem,
} from "./brain.js";

// ─── Tool Runtime ───────────────────────────────────────────
export type {
  ToolCategory,
  ToolRegistration,
  ToolInvocation,
  ToolResult,
} from "./tools.js";

// ─── Verification & PoC ────────────────────────────────────
export type {
  VerificationStatus,
  VerificationCheck,
  ProofOfCompletion,
} from "./verification.js";

// ─── Checkpoints ────────────────────────────────────────────
export type {
  Checkpoint,
  RollbackRequest,
} from "./checkpoints.js";

// ─── Memory ─────────────────────────────────────────────────
export type {
  MemoryScope,
  MemoryEntry,
  MemoryQuery,
} from "./memory.js";

// ─── Interaction Modes ──────────────────────────────────────
export type { InteractionMode, ModeConfig } from "./modes.js";
export { MODE_CONFIGS } from "./modes.js";

// ─── UFP Messages ───────────────────────────────────────────
export type {
  UFPMessage,
  ClientMessage,
  ServerMessage,
  StartSessionPayload,
  UserPromptPayload,
  TaskActionPayload,
  CheckpointActionPayload,
  ErrorPayload,
} from "./messages.js";

// ─── Database Schemas & Types ───────────────────────────────
export * from "./database.js";

// ─── Utility: Generate unique IDs ───────────────────────────
export { generateId } from "./utils.js";

