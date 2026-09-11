/**
 * FluxIDE Engine — Permission Gate
 *
 * Every tool invocation passes through this gate.
 * Evaluates permission rules, detects dangerous patterns,
 * and requests user approval when policy requires it.
 */

import type {
  PermissionConfig,
  PermissionPolicy,
  PermissionScope,
  PermissionRule,
  PermissionResponse,
} from "@fluxide/protocol";

/** Callback to request user approval (wired to client via UFP) */
export type PermissionDecision = PermissionResponse["decision"];

export type ApprovalCallback = (
  scope: string,
  agentId: string,
  toolName: string,
  details: Record<string, unknown>
) => Promise<PermissionDecision>;

export class PermissionGate {
  private config: PermissionConfig;
  private sessionAllowances = new Set<string>();
  private onApprovalRequired: ApprovalCallback | null = null;

  constructor(config?: Partial<PermissionConfig>) {
    this.config = {
      defaultPolicy: config?.defaultPolicy ?? "ask",
      rules: config?.rules ?? [],
      dangerousPatterns: config?.dangerousPatterns ?? [
        "rm -rf /",
        "rm -rf ~",
        "format c:",
        "DROP DATABASE",
        "DROP TABLE",
        "TRUNCATE TABLE",
        "git push --force",
        "git push -f",
        "del /s /q",
        "shutdown",
        "mkfs",
      ],
    };
  }

  /**
   * Set the callback for requesting user approval.
   */
  setApprovalCallback(callback: ApprovalCallback): void {
    this.onApprovalRequired = callback;
  }

  /**
   * Check whether a tool action is permitted.
   */
  async check(
    scope: string,
    agentId: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<boolean> {
    // ── Check for dangerous patterns (always blocked) ─────
    if (this.isDangerous(input)) {
      console.warn(
        `🚫 BLOCKED dangerous pattern in ${toolName} from agent ${agentId}`
      );
      return false;
    }

    // ── Check session allowances ──────────────────────────
    const sessionKey = `${agentId}:${scope}`;
    if (this.sessionAllowances.has(sessionKey)) {
      return true;
    }

    // ── Find matching rule ────────────────────────────────
    const rule = this.findMatchingRule(scope, agentId);
    const policy = rule?.policy ?? this.config.defaultPolicy;

    switch (policy) {
      case "always_allow":
        return true;

      case "deny":
        return false;

      case "ask":
        if (this.onApprovalRequired) {
          const decision = await this.onApprovalRequired(
            scope,
            agentId,
            toolName,
            input
          );
          if (decision === "allow_session") {
            // Allow the approved scope for the lifetime of this agent session.
            this.sessionAllowances.add(sessionKey);
          }
          if (decision === "allow_project") {
            this.addRule({
              scope: scope as PermissionScope,
              policy: "always_allow",
              agentId,
            });
          }

          // User-level "always" policy is intentionally not persisted here.
          // A host with authenticated user settings may translate it to a
          // project policy after enforcing its own organization policy.
          return decision !== "deny";
        }
        // If no approval callback, default to deny for safety
        console.warn(
          `⚠️  No approval callback set, denying ${scope} for ${toolName}`
        );
        return false;

      default:
        return false;
    }
  }

  /**
   * Add a permission rule dynamically.
   */
  addRule(rule: PermissionRule): void {
    this.config = {
      ...this.config,
      rules: [...this.config.rules, rule],
    };
  }

  /**
   * Clear session allowances (e.g. when session ends).
   */
  clearSession(): void {
    this.sessionAllowances.clear();
  }

  /**
   * Get the current configuration.
   */
  getConfig(): PermissionConfig {
    return this.config;
  }

  private findMatchingRule(
    scope: string,
    agentId: string
  ): PermissionRule | undefined {
    // Most specific rule wins: agent-specific > general
    return (
      this.config.rules.find(
        (r) => r.scope === scope && r.agentId === agentId
      ) ?? this.config.rules.find((r) => r.scope === scope && !r.agentId)
    );
  }

  private isDangerous(input: Record<string, unknown>): boolean {
    const inputStr = JSON.stringify(input).toLowerCase();
    return this.config.dangerousPatterns.some((pattern) =>
      inputStr.includes(pattern.toLowerCase())
    );
  }
}
