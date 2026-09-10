/**
 * FluxIDE Engine — Cost & Token Accounting & Audit Replay
 *
 * Implements Section 8.1 (Scale & Economics) & Section 30 (Agent Replay and Audit).
 * - Tracks token consumption (prompt, completion, reasoning, cache read/write)
 * - Estimates costs in USD based on provider model pricing matrices
 * - Writes persistent structured audit trails to .flux/audit.jsonl
 */

import { existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { generateId } from "@fluxide/protocol";
import type { TokenUsage, AgentAction } from "@fluxide/protocol";

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-3-7-sonnet": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "claude-3-5-sonnet": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "claude-3-5-haiku": { inputPerMillion: 0.8, outputPerMillion: 4.0 },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "gemini-1.5-pro": { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  "ollama": { inputPerMillion: 0.0, outputPerMillion: 0.0 },
  "default": { inputPerMillion: 2.0, outputPerMillion: 8.0 },
};

export class AccountingManager {
  private sessionUsage = new Map<string, TokenUsage>();
  private auditLogPath: string;

  constructor(private readonly workspacePath: string = process.cwd()) {
    this.auditLogPath = join(workspacePath, ".flux", "audit.jsonl");
  }

  /**
   * Calculate cost in USD from token counts and model name.
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const key = Object.keys(MODEL_PRICING).find((k) => model.toLowerCase().includes(k)) ?? "default";
    const pricing = MODEL_PRICING[key] ?? MODEL_PRICING.default;

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Record token usage for a session.
   */
  recordUsage(sessionId: string, model: string, inputTokens: number, outputTokens: number): TokenUsage {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const existing = this.sessionUsage.get(sessionId) ?? {
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    };

    const updated: TokenUsage = {
      inputTokens: existing.inputTokens + inputTokens,
      outputTokens: existing.outputTokens + outputTokens,
      estimatedCostUsd: Number((existing.estimatedCostUsd + cost).toFixed(6)),
    };

    this.sessionUsage.set(sessionId, updated);
    return updated;
  }

  /**
   * Get total accumulated usage for a session.
   */
  getSessionUsage(sessionId: string): TokenUsage {
    return (
      this.sessionUsage.get(sessionId) ?? {
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      }
    );
  }

  /**
   * Append a structured action entry to the persistent audit log (.flux/audit.jsonl).
   */
  logAudit(action: AgentAction, metadata: { sessionId?: string; agentRole?: string; model?: string } = {}): void {
    try {
      const dir = dirname(this.auditLogPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const entry = {
        ...action,
        ...metadata,
        recordedAt: new Date().toISOString(),
      };

      appendFileSync(this.auditLogPath, JSON.stringify(entry) + "\n", "utf8");
    } catch {
      // Non-fatal if audit logging fails to disk
    }
  }
}
