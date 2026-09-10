/**
 * @fluxide/protocol — Memory System Schema
 *
 * Three-tier memory: User (persistent preferences), Project
 * (project-specific knowledge), and Task (ephemeral scratchpad).
 */

// ─── Memory Scope ───────────────────────────────────────────
export type MemoryScope = "user" | "project" | "task";

// ─── Memory Entry ───────────────────────────────────────────
export interface MemoryEntry {
  readonly id: string;
  readonly scope: MemoryScope;
  readonly key: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: "user" | "agent" | "system";
}

// ─── Memory Query ───────────────────────────────────────────
export interface MemoryQuery {
  readonly scope?: MemoryScope;
  readonly search?: string;
  readonly tags?: readonly string[];
  readonly limit?: number;
}
