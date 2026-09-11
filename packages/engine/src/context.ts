/**
 * FluxIDE Engine — Context Engine
 *
 * Intelligent context selection, reference resolution, and relevance ranking.
 * Synthesizes:
 * - Direct references: @file, @folder, @symbol, @git, @memory, @brain
 * - Relevant Project Brain graph nodes & relations
 * - 3-tier Memory entries
 * - Token budgeting and deduplication
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  ContextItem,
  ContextReference,
  ContextReferenceType,
} from "@fluxide/protocol";
import type { ProjectBrain } from "./brain.js";
import type { MemoryManager } from "./memory.js";

export interface ContextEngineOptions {
  workspacePath: string;
  brain: ProjectBrain;
  memory: MemoryManager;
  maxContextTokens?: number;
}

export class ContextEngine {
  private workspacePath: string;
  private brain: ProjectBrain;
  private memory: MemoryManager;
  private maxContextTokens: number;

  constructor(options: ContextEngineOptions) {
    this.workspacePath = options.workspacePath;
    this.brain = options.brain;
    this.memory = options.memory;
    this.maxContextTokens = options.maxContextTokens ?? 16_000;
  }

  /**
   * Parse '@ref' mentions from a user prompt.
   * e.g. "Check @file:src/index.ts and @symbol:boot"
   */
  parseReferences(prompt: string): ContextReference[] {
    const refs: ContextReference[] = [];
    const pattern = /@([a-z]+)(?::([^\s]+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(prompt)) !== null) {
      const typeRaw = match[1]?.toLowerCase();
      const val = match[2] ?? "";

      const type: ContextReferenceType = this.mapRefType(typeRaw ?? "");
      refs.push({
        type,
        value: val,
        label: match[0],
      });
    }

    return refs;
  }

  /**
   * Assemble and rank context for a given prompt, active file, and session.
   */
  async assembleContext(options: {
    prompt: string;
    activeFilePath?: string;
    selection?: { startLine: number; endLine: number };
    taskId?: string;
  }): Promise<{ items: ContextItem[]; totalTokens: number; summary: string }> {
    const { prompt, activeFilePath, taskId } = options;
    const items: ContextItem[] = [];

    // 1. Resolve explicit references
    const refs = this.parseReferences(prompt);
    for (const ref of refs) {
      const resolved = await this.resolveReference(ref);
      if (resolved) items.push(resolved);
    }

    // 2. Active file context
    if (activeFilePath) {
      const fileItem = await this.loadFileContext(activeFilePath);
      if (fileItem && !items.some((i) => i.filePath === fileItem.filePath)) {
        items.push(fileItem);
      }
    }

    // 3. Relevant Project Brain symbols
    const brainResult = await this.brain.query({
      type: "search",
      query: prompt.slice(0, 100),
      limit: 5,
    });

    for (const node of brainResult.nodes) {
      if (node.filePath && !items.some((i) => i.filePath === node.filePath)) {
        const item = await this.loadFileContext(node.filePath);
        if (item) {
          items.push({
            ...item,
            relevanceScore: brainResult.relevanceScores[node.id] ?? 0.6,
          });
        }
      }
    }

    // 4. Relevant Memories (User & Project rules/knowledge)
    const memories = await this.memory.query({ search: prompt, limit: 3 }, taskId);
    for (const mem of memories) {
      items.push({
        source: `memory:${mem.scope}`,
        type: "memory",
        content: `[Memory:${mem.scope.toUpperCase()}] ${mem.key}: ${mem.content}`,
        tokenCount: Math.ceil(mem.content.length / 4),
        relevanceScore: 0.8,
      });
    }

    // 5. Rank by relevance score and enforce token budget
    items.sort((a, b) => b.relevanceScore - a.relevanceScore);

    let budget = this.maxContextTokens;
    const included: ContextItem[] = [];
    let usedTokens = 0;

    for (const item of items) {
      if (usedTokens + item.tokenCount <= budget) {
        included.push(item);
        usedTokens += item.tokenCount;
      }
    }

    const summary = `Assembled ${included.length} context items (${usedTokens} tokens)`;
    return { items: included, totalTokens: usedTokens, summary };
  }

  // ─── Reference Resolvers ──────────────────────────────────

  private async resolveReference(ref: ContextReference): Promise<ContextItem | null> {
    switch (ref.type) {
      case "file":
        return this.loadFileContext(ref.value);
      case "memory": {
        const mem = await this.memory.getByKey("project", ref.value);
        if (mem) {
          return {
            source: "memory:project",
            type: "memory",
            content: `[Project Memory] ${mem.key}: ${mem.content}`,
            tokenCount: Math.ceil(mem.content.length / 4),
            relevanceScore: 1.0,
          };
        }
        return null;
      }
      case "symbol": {
        const brainRes = await this.brain.query({ type: "symbol", query: ref.value, limit: 1 });
        const node = brainRes.nodes[0];
        if (node?.filePath) {
          return this.loadFileContext(node.filePath);
        }
        return null;
      }
      default:
        return null;
    }
  }

  private async loadFileContext(relPath: string): Promise<ContextItem | null> {
    try {
      const fullPath = join(this.workspacePath, relPath);
      if (!existsSync(fullPath)) return null;

      const content = await readFile(fullPath, "utf-8");
      const lines = content.split("\n");
      const trimmed = lines.slice(0, 500).join("\n"); // Cap single file view

      return {
        source: relPath,
        type: "file",
        filePath: relPath,
        content: `// File: ${relPath}\n${trimmed}`,
        tokenCount: Math.ceil(trimmed.length / 4),
        relevanceScore: 0.9,
      };
    } catch {
      return null;
    }
  }

  private mapRefType(raw: string): ContextReferenceType {
    const valid: ContextReferenceType[] = [
      "file", "folder", "symbol", "repo", "git", "terminal", "browser",
      "task", "database", "api", "docs", "project", "memory", "mcp"
    ];
    return valid.includes(raw as ContextReferenceType) ? (raw as ContextReferenceType) : "file";
  }
}
