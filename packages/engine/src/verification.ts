/** Verification commands and evidence-based Proof of Work records. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { terminalExecute } from "./tools/terminal.js";
import { generateId } from "@fluxide/protocol";
import type { ProofOfCompletion, VerificationCheck, VerificationStatus } from "@fluxide/protocol";

export interface VerificationEngineOptions { workspacePath: string; }
export interface SelfHealingDiagnosis {
  errorType: "type_error" | "assertion_failure" | "syntax_error" | "runtime_crash" | "unknown";
  failingFiles: string[];
  suggestedAction: string;
  rawErrorSnippet: string;
}

export class VerificationEngine {
  constructor(private readonly workspacePath: string | VerificationEngineOptions) {}

  private get root(): string {
    return typeof this.workspacePath === "string" ? this.workspacePath : this.workspacePath.workspacePath;
  }

  detectTestRunner(): { name: string; command: string } {
    const pkgPath = join(this.root, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts?: Record<string, string>; devDependencies?: Record<string, string>; dependencies?: Record<string, string> };
        if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') return { name: "npm_test", command: "npm test" };
        if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return { name: "vitest", command: "npx vitest run" };
        if (pkg.devDependencies?.jest || pkg.dependencies?.jest) return { name: "jest", command: "npx jest" };
      } catch { /* invalid package manifest: try other ecosystems */ }
    }
    if (existsSync(join(this.root, "pytest.ini")) || existsSync(join(this.root, "tests"))) return { name: "pytest", command: "pytest" };
    if (existsSync(join(this.root, "Cargo.toml"))) return { name: "cargo_test", command: "cargo test" };
    if (existsSync(join(this.root, "go.mod"))) return { name: "go_test", command: "go test ./..." };
    return { name: "default", command: "npm test --if-present" };
  }

  async generateProofOfCompletion(options: { taskId: string; requirementsMet: string[]; filesModified: string[]; gitDiffSnippet?: string }): Promise<ProofOfCompletion> {
    const checks = [
      await this.executeCheck("typecheck", "npm run typecheck --if-present", "typecheck"),
      await this.executeCheck("test", this.detectTestRunner().command, "unit_test"),
      await this.executeCheck("git_status", "git status --short", "git_diff"),
    ];
    return this.createProof({ ...options, checks });
  }

  /** Construct a proof without rerunning commands already authorized by the tool runtime. */
  createProof(options: { taskId: string; requirementsMet: string[]; filesModified: string[]; checks: VerificationCheck[]; gitDiffSnippet?: string }): ProofOfCompletion {
    const verified = options.checks.length > 0 && options.checks.every((check) => check.status === "passed" || check.status === "skipped");
    return {
      id: generateId("poc"), taskId: options.taskId, taskTitle: `Verification for ${options.taskId}`,
      verified, status: verified ? "verified" : "failed", checks: options.checks,
      requirementsSatisfied: options.requirementsMet, filesChanged: options.filesModified, diffSha: options.gitDiffSnippet,
      remainingRisks: verified ? [] : ["One or more verification checks failed or could not be run. Review the evidence before accepting changes."],
      generatedAt: new Date().toISOString(),
    };
  }

  async verifyWorkspace(options: { strategies?: string[]; customCommand?: string } = {}): Promise<{ passed: boolean; summary: string; checks: VerificationCheck[] }> {
    if (options.customCommand) {
      const check = await this.executeCheck("automated_verify", options.customCommand, "unit_test");
      return { passed: check.status === "passed", summary: check.status === "passed" ? "Verification passed cleanly." : "Verification failed.", checks: [check] };
    }
    const strategies = options.strategies?.length ? options.strategies : ["typecheck", "test"];
    const checks: VerificationCheck[] = [];
    for (const strategy of strategies) {
      if (strategy === "typecheck") checks.push(await this.executeCheck("typecheck", "npm run typecheck --if-present", "typecheck"));
      else if (strategy === "test") checks.push(await this.executeCheck("test", this.detectTestRunner().command, "unit_test"));
      else if (strategy === "lint") checks.push(await this.executeCheck("lint", "npm run lint --if-present", "lint"));
    }
    const passed = checks.length > 0 && checks.every((check) => check.status === "passed");
    return { passed, summary: passed ? "Verification passed cleanly." : "Verification failed.", checks };
  }

  diagnoseFailure(output: string): SelfHealingDiagnosis {
    const tsMatch = output.match(/([a-zA-Z0-9_/\\.-]+\.ts)\((\d+),(\d+)\): error TS(\d+):/);
    if (tsMatch?.[1] && tsMatch[2] && tsMatch[4]) {
      return { errorType: "type_error", failingFiles: [tsMatch[1]], suggestedAction: `Fix TypeScript error TS${tsMatch[4]} in ${tsMatch[1]} at line ${tsMatch[2]}.`, rawErrorSnippet: output.slice(0, 1000) };
    }
    if (output.includes("SyntaxError")) return { errorType: "syntax_error", failingFiles: [], suggestedAction: "Correct the reported syntax error.", rawErrorSnippet: output.slice(0, 1000) };
    if (output.includes("AssertionError") || output.includes("expect(")) return { errorType: "assertion_failure", failingFiles: [], suggestedAction: "Align the implementation with the failing assertion.", rawErrorSnippet: output.slice(0, 1000) };
    return { errorType: "unknown", failingFiles: [], suggestedAction: "Review the failing command output and stack trace.", rawErrorSnippet: output.slice(0, 1000) };
  }

  private async executeCheck(name: string, command: string, category: VerificationCheck["category"]): Promise<VerificationCheck> {
    const start = Date.now();
    try {
      const evidence = await terminalExecute({ command, cwd: this.root, timeoutMs: 60_000 });
      const failed = /Exit code: [^0]|\bFAIL\b/.test(evidence);
      return { id: generateId("check"), name, category, status: failed ? "failed" : "passed", evidence: evidence.slice(0, 4000), details: { command }, durationMs: Date.now() - start };
    } catch (error) {
      return { id: generateId("check"), name, category, status: "failed", evidence: error instanceof Error ? error.message : String(error), details: { command }, durationMs: Date.now() - start };
    }
  }
}
