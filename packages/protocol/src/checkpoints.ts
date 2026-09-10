/**
 * @fluxide/protocol — Checkpoint & Rollback Schema
 *
 * Before significant modifications, agents create checkpoints
 * that preserve complete project state for safe recovery.
 */

// ─── Checkpoint ─────────────────────────────────────────────
export interface Checkpoint {
  readonly id: string;
  readonly taskId?: string;
  readonly agentId?: string;
  readonly description: string;

  /** Git ref (commit SHA or stash ref) */
  readonly gitRef: string;

  /** Snapshot of task state at checkpoint time */
  readonly taskStateSnapshot?: Record<string, unknown>;

  /** Files that existed at checkpoint time */
  readonly fileManifest: readonly string[];

  readonly createdAt: string;
}

// ─── Rollback Request ───────────────────────────────────────
export interface RollbackRequest {
  readonly checkpointId: string;
  readonly reason: string;
}
