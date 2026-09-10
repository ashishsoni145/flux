/**
 * FluxIDE Engine — 3-Tier Memory System
 *
 * Implements persistent and ephemeral memory across three scopes:
 * - User: Global developer preferences and coding habits
 * - Project: Project-specific architectural conventions and knowledge
 * - Task: Ephemeral working scratchpad for agent reasoning
 *
 * Fully inspectable, searchable, editable, and scoped.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { generateId } from "@fluxide/protocol";
import type { MemoryEntry, MemoryQuery, MemoryScope } from "@fluxide/protocol";

export interface MemoryManagerOptions {
  workspacePath: string;
  globalPath?: string;
}

export class MemoryManager {
  private workspacePath: string;
  private projectMemoryFile: string;
  private userMemoryFile: string;

  // In-memory caches for fast access
  private userEntries = new Map<string, MemoryEntry>();
  private projectEntries = new Map<string, MemoryEntry>();
  private taskEntries = new Map<string, Map<string, MemoryEntry>>(); // taskId -> entries

  constructor(options: MemoryManagerOptions) {
    this.workspacePath = options.workspacePath;
    this.projectMemoryFile = join(this.workspacePath, ".flux", "project-memory.json");

    const defaultGlobal = process.env["FLUX_GLOBAL_DIR"] ?? join(homedir(), ".flux");
    this.userMemoryFile = join(options.globalPath ?? defaultGlobal, "user-memory.json");
  }

  /**
   * Load persisted memories from disk.
   */
  async initialize(): Promise<void> {
    await this.loadFromDisk(this.userMemoryFile, this.userEntries);
    await this.loadFromDisk(this.projectMemoryFile, this.projectEntries);
  }

  /**
   * Store a memory entry.
   */
  async set(
    scope: MemoryScope,
    key: string,
    content: string,
    options: {
      tags?: string[];
      source?: "user" | "agent" | "system";
      taskId?: string;
    } = {}
  ): Promise<MemoryEntry> {
    const existing = await this.getByKey(scope, key, options.taskId);
    const now = new Date().toISOString();

    const entry: MemoryEntry = {
      id: existing ? existing.id : generateId("mem"),
      scope,
      key,
      content,
      tags: options.tags ?? existing?.tags ?? [],
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      source: options.source ?? "agent",
    };

    if (scope === "user") {
      this.userEntries.set(entry.id, entry);
      await this.saveToDisk(this.userMemoryFile, this.userEntries);
    } else if (scope === "project") {
      this.projectEntries.set(entry.id, entry);
      await this.saveToDisk(this.projectMemoryFile, this.projectEntries);
    } else if (scope === "task") {
      const taskId = options.taskId ?? "default";
      if (!this.taskEntries.has(taskId)) {
        this.taskEntries.set(taskId, new Map());
      }
      this.taskEntries.get(taskId)!.set(entry.id, entry);
    }

    return entry;
  }

  /**
   * Get an entry by its ID.
   */
  get(id: string): MemoryEntry | undefined {
    if (this.userEntries.has(id)) return this.userEntries.get(id);
    if (this.projectEntries.has(id)) return this.projectEntries.get(id);

    for (const taskMap of this.taskEntries.values()) {
      if (taskMap.has(id)) return taskMap.get(id);
    }
    return undefined;
  }

  /**
   * Get an entry by key and scope.
   */
  async getByKey(
    scope: MemoryScope,
    key: string,
    taskId?: string
  ): Promise<MemoryEntry | undefined> {
    if (scope === "user") {
      for (const entry of this.userEntries.values()) {
        if (entry.key === key) return entry;
      }
    } else if (scope === "project") {
      for (const entry of this.projectEntries.values()) {
        if (entry.key === key) return entry;
      }
    } else if (scope === "task") {
      const taskMap = this.taskEntries.get(taskId ?? "default");
      if (taskMap) {
        for (const entry of taskMap.values()) {
          if (entry.key === key) return entry;
        }
      }
    }
    return undefined;
  }

  /**
   * Query memories across scopes with optional search term and tag filters.
   */
  async query(q: MemoryQuery, taskId?: string): Promise<MemoryEntry[]> {
    let pool: MemoryEntry[] = [];

    if (!q.scope || q.scope === "user") {
      pool.push(...this.userEntries.values());
    }
    if (!q.scope || q.scope === "project") {
      pool.push(...this.projectEntries.values());
    }
    if (!q.scope || q.scope === "task") {
      const taskMap = this.taskEntries.get(taskId ?? "default");
      if (taskMap) {
        pool.push(...taskMap.values());
      }
    }

    // Filter by tags
    if (q.tags && q.tags.length > 0) {
      const tagSet = new Set(q.tags);
      pool = pool.filter((entry) => entry.tags.some((t) => tagSet.has(t)));
    }

    // Filter by search string
    if (q.search) {
      const lower = q.search.toLowerCase();
      pool = pool.filter(
        (entry) =>
          entry.key.toLowerCase().includes(lower) ||
          entry.content.toLowerCase().includes(lower) ||
          entry.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }

    // Sort newest updated first
    pool.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (q.limit && q.limit > 0) {
      pool = pool.slice(0, q.limit);
    }

    return pool;
  }

  /**
   * Delete a memory entry by ID.
   */
  async delete(id: string): Promise<boolean> {
    if (this.userEntries.has(id)) {
      this.userEntries.delete(id);
      await this.saveToDisk(this.userMemoryFile, this.userEntries);
      return true;
    }
    if (this.projectEntries.has(id)) {
      this.projectEntries.delete(id);
      await this.saveToDisk(this.projectMemoryFile, this.projectEntries);
      return true;
    }
    for (const taskMap of this.taskEntries.values()) {
      if (taskMap.has(id)) {
        taskMap.delete(id);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear task-scoped memory when a task concludes.
   */
  clearTask(taskId?: string): void {
    if (taskId) {
      this.taskEntries.delete(taskId);
    } else {
      this.taskEntries.clear();
    }
  }

  // ─── Persistence Helpers ────────────────────────────────────

  private async loadFromDisk(
    filePath: string,
    targetMap: Map<string, MemoryEntry>
  ): Promise<void> {
    try {
      if (!existsSync(filePath)) return;
      const raw = await readFile(filePath, "utf-8");
      const list = JSON.parse(raw) as MemoryEntry[];
      targetMap.clear();
      for (const item of list) {
        targetMap.set(item.id, item);
      }
    } catch {
      // Ignore initial file missing or corrupted
    }
  }

  private async saveToDisk(
    filePath: string,
    sourceMap: Map<string, MemoryEntry>
  ): Promise<void> {
    try {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      const data = JSON.stringify(Array.from(sourceMap.values()), null, 2);
      await writeFile(filePath, data, "utf-8");
    } catch (err) {
      console.error(`[MemoryManager] Failed to persist memory to ${filePath}:`, err);
    }
  }
}
