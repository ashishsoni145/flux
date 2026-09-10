/**
 * FluxIDE Engine — Project Rules Engine
 *
 * Implements machine-checkable rules and guidelines validation.
 * Discovers rules from:
 * - .flux/rules/
 * - .cursorrules / .windsurfrules / AGENTS.md / CLAUDE.md
 *
 * Validates file modifications, tool calls, and agent actions against active constraints.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface ProjectRule {
  id: string;
  title: string;
  scope: "global" | "project" | "folder" | "language" | "security";
  description: string;
  rawContent: string;
  pattern?: string; // glob or regex pattern
  disallowedPatterns?: string[]; // e.g., forbidden imports, hardcoded secrets, disallowed commands
  mandatoryPatterns?: string[];
  severity: "error" | "warning" | "info";
}

export interface RuleViolation {
  ruleId: string;
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
}

export class RulesEngine {
  private rules: ProjectRule[] = [];

  constructor(private readonly workspacePath: string = process.cwd()) {}

  /**
   * Load and index all rules across the workspace.
   */
  async loadRules(): Promise<ProjectRule[]> {
    this.rules = [];

    // 1. Built-in universal safety rules
    this.rules.push({
      id: "rule_no_hardcoded_secrets",
      title: "No Hardcoded Secrets or Private Keys",
      scope: "security",
      description: "Do not commit private keys, raw API tokens, or credentials into source code.",
      rawContent: "Enforce zero plaintext secrets.",
      disallowedPatterns: [
        "AIza[0-9A-Za-z-_]{35}", // Google API key
        "sk-ant-[a-zA-Z0-9_-]{32,}", // Anthropic key
        "sk-[a-zA-Z0-9]{32,}", // OpenAI key
        "-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----",
      ],
      severity: "error",
    });

    this.rules.push({
      id: "rule_no_destructive_commands",
      title: "Disallow Unchecked Destructive Terminal Operations",
      scope: "security",
      description: "Commands that wipe system directories or force push to main are prohibited.",
      rawContent: "Block destructive shell invocations.",
      disallowedPatterns: [
        "rm -rf /",
        "rm -rf *",
        "format [a-zA-Z]:",
        "git push --force origin (main|master)",
      ],
      severity: "error",
    });

    // 2. Discover workspace rule files
    const candidateFiles = [
      "AGENTS.md",
      "CLAUDE.md",
      ".cursorrules",
      ".windsurfrules",
      ".fluxrules",
    ];

    for (const filename of candidateFiles) {
      const fullPath = join(this.workspacePath, filename);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, "utf8");
          this.rules.push({
            id: `rule_file_${filename.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            title: `Workspace Rule: ${filename}`,
            scope: "project",
            description: `Loaded from ${filename}`,
            rawContent: content,
            severity: "warning",
          });
        } catch {
          // ignore read error
        }
      }
    }

    // 3. Discover rules in .flux/rules/ or .agents/rules/
    const ruleDirs = [
      join(this.workspacePath, ".flux", "rules"),
      join(this.workspacePath, ".agents", "rules"),
    ];

    for (const dir of ruleDirs) {
      if (existsSync(dir)) {
        try {
          const files = readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".json"));
          for (const file of files) {
            const content = readFileSync(join(dir, file), "utf8");
            this.rules.push({
              id: `rule_dir_${file.replace(/[^a-z0-9]/gi, "_")}`,
              title: `Rule: ${file}`,
              scope: "project",
              description: `Loaded from ${join(dir, file)}`,
              rawContent: content,
              severity: "warning",
            });
          }
        } catch {
          // ignore
        }
      }
    }

    return this.rules;
  }

  /**
   * Validate file content before write or patch.
   */
  validateContent(filePath: string, content: string): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const rule of this.rules) {
      if (rule.disallowedPatterns) {
        for (const pattern of rule.disallowedPatterns) {
          try {
            const regex = new RegExp(pattern, "i");
            if (regex.test(content)) {
              violations.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Violation of "${rule.title}": Disallowed pattern detected (${pattern})`,
                file: filePath,
              });
            }
          } catch {
            // plain string fallback
            if (content.includes(pattern)) {
              violations.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Violation of "${rule.title}": Disallowed pattern detected (${pattern})`,
                file: filePath,
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Validate command line string before execution.
   */
  validateCommand(command: string): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const rule of this.rules) {
      if (rule.disallowedPatterns) {
        for (const pattern of rule.disallowedPatterns) {
          try {
            const regex = new RegExp(pattern, "i");
            if (regex.test(command)) {
              violations.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Violation of "${rule.title}": Dangerous command pattern detected (${pattern})`,
              });
            }
          } catch {
            if (command.includes(pattern)) {
              violations.push({
                ruleId: rule.id,
                severity: rule.severity,
                message: `Violation of "${rule.title}": Dangerous command pattern detected (${pattern})`,
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Get formatted rules prompt segment to inject into LLM system prompt.
   */
  getRulesPrompt(): string {
    if (this.rules.length === 0) return "";

    const lines = ["\n--- ACTIVE PROJECT RULES & CONSTRAINTS ---"];
    for (const r of this.rules) {
      lines.push(`• [${r.severity.toUpperCase()}] ${r.title}:`);
      // Keep snippet concise
      const snippet = r.rawContent.trim().split("\n").slice(0, 5).join("\n  ");
      lines.push(`  ${snippet}`);
    }
    lines.push("-------------------------------------------\n");
    return lines.join("\n");
  }

  getLoadedRules(): readonly ProjectRule[] {
    return this.rules;
  }
}
