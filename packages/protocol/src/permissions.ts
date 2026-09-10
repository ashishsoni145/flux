/**
 * @fluxide/protocol — Permission System Schema
 *
 * Granular autonomy controls governing what agents can do.
 * Every tool invocation passes through this permission gate.
 */

// ─── Permission Scopes ──────────────────────────────────────
export type PermissionScope =
  | "fs:read"
  | "fs:write"
  | "fs:delete"
  | "shell:execute"
  | "shell:background"
  | "git:read"
  | "git:write"
  | "git:destructive"
  | "net:request"
  | "net:listen"
  | "browser:navigate"
  | "browser:interact"
  | "db:read"
  | "db:write"
  | "db:migrate"
  | "db:destructive"
  | "deploy:staging"
  | "deploy:production"
  | "infra:modify"
  | "secrets:read"
  | "mcp:invoke";

// ─── Permission Policy ──────────────────────────────────────
export type PermissionPolicy = "always_allow" | "ask" | "deny";

// ─── Permission Rule ────────────────────────────────────────
export interface PermissionRule {
  readonly scope: PermissionScope;
  readonly policy: PermissionPolicy;

  /** Optional glob pattern to restrict to specific paths */
  readonly pathPattern?: string;

  /** Optional command pattern (regex) for shell permissions */
  readonly commandPattern?: string;

  /** Optional agent ID this rule applies to (undefined = all) */
  readonly agentId?: string;
}

// ─── Permission Request (sent to client for approval) ───────
export interface PermissionRequest {
  readonly id: string;
  readonly scope: PermissionScope;
  readonly agentId: string;
  readonly taskId: string;
  readonly description: string;
  readonly details: Record<string, unknown>;
  readonly timestamp: string;
}

// ─── Permission Response (from client) ──────────────────────
export interface PermissionResponse {
  readonly requestId: string;
  readonly decision: "allow_once" | "allow_session" | "allow_always" | "deny";
}

// ─── Permission Configuration ───────────────────────────────
export interface PermissionConfig {
  readonly defaultPolicy: PermissionPolicy;
  readonly rules: PermissionRule[];

  /** Patterns that are ALWAYS blocked regardless of rules */
  readonly dangerousPatterns: readonly string[];
}
