/**
 * @fluxide/protocol — Proof of Completion Schema
 *
 * Evidence-based verification system. Tasks are only marked VERIFIED
 * when sufficient automated evidence confirms success.
 */

// ─── Verification Status ────────────────────────────────────
export type VerificationStatus = "pending" | "passed" | "failed" | "skipped" | "partial";

// ─── Verification Check ────────────────────────────────────
export interface VerificationCheck {
  readonly name: string;
  readonly category:
    | "build"
    | "typecheck"
    | "lint"
    | "unit_test"
    | "integration_test"
    | "e2e_test"
    | "browser_visual"
    | "browser_console"
    | "security"
    | "performance"
    | "accessibility"
    | "project_rules"
    | "git_diff";
  readonly status: VerificationStatus;
  readonly evidence: string;
  readonly details?: Record<string, unknown>;
  readonly durationMs?: number;
  readonly screenshotPath?: string;
}

// ─── Proof of Completion ────────────────────────────────────
export interface ProofOfCompletion {
  readonly id: string;
  readonly taskId: string;
  readonly taskTitle: string;

  /** Overall verdict */
  readonly verified: boolean;

  /** Individual checks */
  readonly checks: VerificationCheck[];

  /** Requirements that were satisfied */
  readonly requirementsSatisfied: readonly string[];

  /** Files changed */
  readonly filesChanged: readonly string[];

  /** Git diff SHA */
  readonly diffSha?: string;

  /** Remaining risks or uncertainties */
  readonly remainingRisks: readonly string[];

  readonly generatedAt: string;
}
