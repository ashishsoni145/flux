/**
 * FluxIDE Engine — Checkpoint Manager
 *
 * Checkpoints are file snapshots, not temporary git stashes. Creating one
 * must never alter a user's index, working tree, or stash list. A checkpoint
 * records the exact pre-change state of each affected file so rollback is
 * deterministic even when a repository has uncommitted work.
 */

import { access, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { generateId } from "@fluxide/protocol";
import type { Checkpoint } from "@fluxide/protocol";

interface SnapshotEntry {
  readonly path: string;
  readonly existed: boolean;
  readonly snapshotPath?: string;
}

interface StoredCheckpoint {
  readonly checkpoint: Checkpoint;
  readonly workspacePath: string;
  readonly snapshots: readonly SnapshotEntry[];
}

export class CheckpointManager {
  private checkpoints = new Map<string, StoredCheckpoint>();

  async createCheckpoint(options: {
    workspacePath: string;
    description: string;
    files?: string[];
    taskId?: string;
    agentId?: string;
  }): Promise<Checkpoint> {
    return this.create(
      options.workspacePath,
      options.description,
      options.taskId,
      options.agentId,
      options.files
    );
  }

  /** Create a recoverable snapshot before a significant modification. */
  async create(
    workspacePath: string,
    description: string,
    taskId?: string,
    agentId?: string,
    files: readonly string[] = []
  ): Promise<Checkpoint> {
    const id = generateId("chk");
    const root = resolve(workspacePath);
    const checkpointDir = join(root, ".flux", "checkpoints", id);
    await mkdir(checkpointDir, { recursive: true });

    const uniqueFiles = [...new Set(files)].filter(Boolean);
    const snapshots: SnapshotEntry[] = [];

    for (const requestedPath of uniqueFiles) {
      const absolutePath = resolve(root, requestedPath);
      const pathFromRoot = relative(root, absolutePath);
      if (
        pathFromRoot === "" ||
        pathFromRoot === ".." ||
        pathFromRoot.startsWith(`..${sep}`) ||
        isAbsolute(pathFromRoot)
      ) {
        throw new Error(`Checkpoint path must remain inside the workspace: ${requestedPath}`);
      }

      const snapshotPath = join(checkpointDir, pathFromRoot);
      const existed = await this.fileExists(absolutePath);
      if (existed) {
        await mkdir(dirname(snapshotPath), { recursive: true });
        await copyFile(absolutePath, snapshotPath);
      }

      snapshots.push({
        path: pathFromRoot.replace(/\\/g, "/"),
        existed,
        ...(existed ? { snapshotPath } : {}),
      });
    }

    const checkpoint: Checkpoint = {
      id,
      taskId,
      agentId,
      description,
      // This is a snapshot identifier rather than a mutable Git reference.
      gitRef: `snapshot:${id}`,
      fileManifest: snapshots.map((snapshot) => snapshot.path),
      createdAt: new Date().toISOString(),
    };

    await writeFile(
      join(checkpointDir, "manifest.json"),
      JSON.stringify({ checkpoint, snapshots }, null, 2),
      "utf8"
    );

    this.checkpoints.set(id, { checkpoint, workspacePath: root, snapshots });
    return checkpoint;
  }

  get(id: string): Checkpoint | undefined {
    return this.checkpoints.get(id)?.checkpoint;
  }

  list(): Checkpoint[] {
    return Array.from(this.checkpoints.values())
      .map((entry) => entry.checkpoint)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** Restore only files captured by this checkpoint; unrelated work is kept. */
  async rollback(checkpointId: string, workspacePath?: string): Promise<string> {
    const stored = this.checkpoints.get(checkpointId);
    if (!stored) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const root = resolve(workspacePath ?? stored.workspacePath);
    if (root !== stored.workspacePath) {
      throw new Error("Checkpoint belongs to a different workspace.");
    }

    for (const snapshot of stored.snapshots) {
      const targetPath = resolve(root, snapshot.path);
      if (snapshot.existed && snapshot.snapshotPath) {
        await mkdir(dirname(targetPath), { recursive: true });
        await copyFile(snapshot.snapshotPath, targetPath);
      } else if (await this.fileExists(targetPath)) {
        await rm(targetPath, { force: true });
      }
    }

    return `Restored checkpoint "${stored.checkpoint.description}" (${stored.checkpoint.createdAt}).`;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
