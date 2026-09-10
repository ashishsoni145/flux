/**
 * @fluxide/protocol — Universal Flux Protocol (UFP) Messages
 *
 * JSON-RPC–style messages exchanged between the fluxd daemon
 * and any client (Desktop, CLI, Web, Mobile).
 */

import type { TaskGraph, Task } from "./task.js";
import type { AgentSession, AgentAction } from "./agents.js";
import type { PermissionRequest, PermissionResponse } from "./permissions.js";
import type { ProofOfCompletion } from "./verification.js";
import type { Checkpoint } from "./checkpoints.js";
import type { StreamChunk } from "./models.js";

// ─── Message Envelope ───────────────────────────────────────
export interface UFPMessage<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: string;
}

// ─── Client → Server Messages ───────────────────────────────
export type ClientMessage =
  | UFPMessage<StartSessionPayload> & { type: "session:start" }
  | UFPMessage<UserPromptPayload> & { type: "user:prompt" }
  | UFPMessage<PermissionResponse> & { type: "permission:respond" }
  | UFPMessage<TaskActionPayload> & { type: "task:action" }
  | UFPMessage<CheckpointActionPayload> & { type: "checkpoint:action" }
  | UFPMessage<void> & { type: "session:cancel" }
  | UFPMessage<void> & { type: "session:pause" }
  | UFPMessage<void> & { type: "session:resume" };

export interface StartSessionPayload {
  readonly mode: "ask" | "plan" | "agent" | "debug" | "review" | "design" | "research" | "architect";
  readonly workspacePath: string;
  readonly model?: string;
}

export interface UserPromptPayload {
  readonly content: string;
  readonly contextRefs?: readonly import("./brain.js").ContextReference[];
  readonly attachments?: readonly string[];
}

export interface TaskActionPayload {
  readonly taskId: string;
  readonly action: "approve" | "reject" | "pause" | "resume" | "cancel" | "retry";
  readonly comment?: string;
}

export interface CheckpointActionPayload {
  readonly action: "rollback" | "compare" | "branch";
  readonly checkpointId: string;
}

// ─── Server → Client Messages ───────────────────────────────
export type ServerMessage =
  | UFPMessage<StreamChunk> & { type: "stream:chunk" }
  | UFPMessage<AgentAction> & { type: "agent:action" }
  | UFPMessage<AgentSession> & { type: "agent:status" }
  | UFPMessage<TaskGraph> & { type: "task:graph" }
  | UFPMessage<Task> & { type: "task:update" }
  | UFPMessage<PermissionRequest> & { type: "permission:request" }
  | UFPMessage<ProofOfCompletion> & { type: "poc:generated" }
  | UFPMessage<Checkpoint> & { type: "checkpoint:created" }
  | UFPMessage<ErrorPayload> & { type: "error" };

export interface ErrorPayload {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
