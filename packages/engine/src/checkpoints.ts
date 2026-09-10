/**
 * FluxIDE Engine — Checkpoint Manager
 *
 * Creates and manages checkpoints for safe agent rollback.
 * Uses git stash / lightweight tags to preserve state.
 */

import { generateId } from "@fluxide/protocol";
import type { Checkpoint } from "@fluxide/protocol";
import { terminalExecute } from "./tools/terminal.js";

export class CheckpointManager {
  private checkpoints = new Map<string, Checkpoint>();

  /**
   * Create a checkpoint before a significant modification.
   */
  async create(
    workspacePath: string,
    description: string,
    taskId?: string,
    agentId?: string
  ): Promise<Checkpoint> {
    const id = generateId("chk");

    // Create a temporary commit to capture current state
    const stashResult = await terminalExecute({
      command: `git stash push -m "flux-checkpoint-${id}" --include-untracked`,
      cwd: workspacePath,
    });

    // Get the stash ref
    const refResult = await terminalExecute({
      command: "git stash list --format=%H -n 1",
      cwd: workspacePath,
    });

    // Pop the stash back immediately — we just wanted the ref
    await terminalExecute({
      command: "git stash pop",
      cwd: workspacePath,
    });

    // Get file manifest
    const filesResult = await terminalExecute({
      command: "git ls-files",
      cwd: workspacePath,
    });

    const gitRef = refResult.split("\n").find((l) => l.match(/^[a-f0-9]+$/)) ?? id;
    const fileManifest = filesResult
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("$") && !l.startsWith("Exit"));

    const checkpoint: Checkpoint = {
      id,
      taskId,
      agentId,
      description,
      gitRef,
      fileManifest,
      createdAt: new Date().toISOString(),
    };

    this.checkpoints.set(id, checkpoint);
    console.log(`📌 Checkpoint created: ${id} — "${description}"`);

    return checkpoint;
  }

  /**
   * Get a checkpoint by ID.
   */
  get(id: string): Checkpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * List all checkpoints.
   */
  list(): Checkpoint[] {
    return Array.from(this.checkpoints.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Rollback to a checkpoint (restores git state).
   */
  async rollback(
    checkpointId: string,
    workspacePath: string
  ): Promise<string> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Hard reset to the checkpoint commit
    const result = await terminalExecute({
      command: `git checkout ${checkpoint.gitRef} -- .`,
      cwd: workspacePath,
    });

    console.log(`⏪ Rolled back to checkpoint: ${checkpointId}`);
    return `Rolled back to checkpoint "${checkpoint.description}" (${checkpoint.createdAt})\n${result}`;
  }
}
