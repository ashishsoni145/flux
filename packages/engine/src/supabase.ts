/**
 * @fluxide/engine - Supabase Repository Client
 *
 * Provides authoritative database operations for:
 * - Quota reservation & settlement
 * - Usage event auditing
 * - Project & workspace synchronization
 * - Agent run execution traces & events
 * - Verification & Proof of Work storage
 * - Project memory & rules retrieval
 */

import type {
  DbAgentRun,
  DbAgentEvent,
  DbVerification,
  DbProofOfWork,
  DbUsageEvent,
  DbProjectRule,
  DbProjectMemory,
} from "@fluxide/protocol";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey?: string;
  anonKey?: string;
}

export interface QuotaReservationResult {
  allowed: boolean;
  reason?: string;
  allocated_credits?: number;
  remaining_credits?: number;
  reserved_credits?: number;
  requested_credits?: number;
}

export interface QuotaSettlementResult {
  success: boolean;
  used_credits: number;
  remaining_credits: number;
  reserved_credits: number;
  status: string;
}

export class SupabaseRepository {
  private readonly url: string;
  private readonly apiKey: string;

  constructor(config?: Partial<SupabaseConfig>) {
    this.url = config?.url || process.env.SUPABASE_URL || "";
    this.apiKey =
      config?.serviceRoleKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      config?.anonKey ||
      process.env.SUPABASE_ANON_KEY ||
      "";
  }

  get isConfigured(): boolean {
    return Boolean(this.url && this.apiKey);
  }

  private requireConfiguration(): void {
    if (!this.isConfigured) {
      throw new Error("Managed backend is not configured. Set SUPABASE_URL and a server-side SUPABASE_SERVICE_ROLE_KEY.");
    }
  }

  private async rpc<T>(functionName: string, params: Record<string, unknown>): Promise<T> {
    this.requireConfiguration();
    const response = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase RPC ${functionName} failed (${response.status}): ${errorText}`);
    }

    return (await response.json()) as T;
  }

  private async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    this.requireConfiguration();
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
        Authorization: `Bearer ${this.apiKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase insert to ${table} failed (${response.status}): ${errorText}`);
    }

    const rows = (await response.json()) as T[];
    return rows[0] as T;
  }


  /**
   * Atomically reserve AI credits before initiating an agent run or AI request.
   */
  async reserveQuota(userId: string, estimatedCredits: number): Promise<QuotaReservationResult> {
    return this.rpc<QuotaReservationResult>("reserve_ai_quota", {
      p_user_id: userId,
      p_estimated_credits: estimatedCredits,
    });
  }

  /**
   * Atomically settle actual AI credits used after completion.
   */
  async settleQuota(
    userId: string,
    reservedCredits: number,
    actualCredits: number
  ): Promise<QuotaSettlementResult> {
    return this.rpc<QuotaSettlementResult>("settle_ai_quota", {
      p_user_id: userId,
      p_reserved_credits: reservedCredits,
      p_actual_credits: actualCredits,
    });
  }

  /**
   * Record immutable usage event in ledger.
   */
  async recordUsageEvent(event: Partial<DbUsageEvent>): Promise<DbUsageEvent> {
    return this.insert<DbUsageEvent>("usage_events", event as Record<string, unknown>);
  }

  /**
   * Persist agent run state.
   */
  async createAgentRun(run: Partial<DbAgentRun>): Promise<DbAgentRun> {
    return this.insert<DbAgentRun>("agent_runs", run as Record<string, unknown>);
  }

  /**
   * Append trace event to agent execution history.
   */
  async recordAgentEvent(event: Partial<DbAgentEvent>): Promise<DbAgentEvent> {
    return this.insert<DbAgentEvent>("agent_events", event as Record<string, unknown>);
  }

  /**
   * Record automated verification results.
   */
  async recordVerification(verification: Partial<DbVerification>): Promise<DbVerification> {
    return this.insert<DbVerification>("verifications", verification as Record<string, unknown>);
  }

  /**
   * Store structured Proof of Work evidence for a completed agent run.
   */
  async recordProofOfWork(pow: Partial<DbProofOfWork>): Promise<DbProofOfWork> {
    return this.insert<DbProofOfWork>("proof_of_work", pow as Record<string, unknown>);
  }

  /**
   * Retrieve active rules for a project.
   */
  async getProjectRules(projectId: string): Promise<DbProjectRule[]> {
    this.requireConfiguration();
    const response = await fetch(
      `${this.url}/rest/v1/project_rules?project_id=eq.${projectId}&is_enabled=eq.true`,
      {
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    if (!response.ok) return [];
    return (await response.json()) as DbProjectRule[];
  }

  /**
   * Retrieve persistent memories for a project.
   */
  async getProjectMemories(projectId: string): Promise<DbProjectMemory[]> {
    this.requireConfiguration();
    const response = await fetch(
      `${this.url}/rest/v1/project_memories?project_id=eq.${projectId}&is_active=eq.true`,
      {
        headers: {
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    if (!response.ok) return [];
    return (await response.json()) as DbProjectMemory[];
  }
}
