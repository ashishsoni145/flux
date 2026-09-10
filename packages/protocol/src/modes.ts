/**
 * @fluxide/protocol — Development Modes
 *
 * The interaction modes available in the AI Experience Layer.
 */

export type InteractionMode =
  | "ask"       // Read-only investigation
  | "plan"      // Spec-first: requirements → design → tasks → verification (no modifications until approved)
  | "agent"     // Autonomous execution within permissions
  | "debug"     // Reproduce → investigate → hypothesis → fix → verify
  | "review"    // Read-only engineering review
  | "design"    // UI/UX-focused workflow
  | "research"  // Research before implementation
  | "architect"; // Architecture creation and critique

export interface ModeConfig {
  readonly mode: InteractionMode;
  readonly displayName: string;
  readonly description: string;
  readonly readOnly: boolean;
  readonly requiresApproval: boolean;
  readonly defaultModel: string;
  readonly maxAutonomy: "none" | "low" | "medium" | "high" | "full";
}

export const MODE_CONFIGS: Record<InteractionMode, ModeConfig> = {
  ask: {
    mode: "ask",
    displayName: "Ask",
    description: "Read-only investigation and analysis",
    readOnly: true,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "none",
  },
  plan: {
    mode: "plan",
    displayName: "Plan",
    description: "Specification-first workflow with approval gates",
    readOnly: true,
    requiresApproval: true,
    defaultModel: "auto",
    maxAutonomy: "none",
  },
  agent: {
    mode: "agent",
    displayName: "Agent",
    description: "Autonomous execution within permission boundaries",
    readOnly: false,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "full",
  },
  debug: {
    mode: "debug",
    displayName: "Debug",
    description: "Systematic diagnosis: reproduce → investigate → fix → verify",
    readOnly: false,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "medium",
  },
  review: {
    mode: "review",
    displayName: "Review",
    description: "Read-only engineering review and critique",
    readOnly: true,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "none",
  },
  design: {
    mode: "design",
    displayName: "Design",
    description: "UI/UX-focused visual development workflow",
    readOnly: false,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "medium",
  },
  research: {
    mode: "research",
    displayName: "Research",
    description: "Deep research and analysis before implementation",
    readOnly: true,
    requiresApproval: false,
    defaultModel: "auto",
    maxAutonomy: "low",
  },
  architect: {
    mode: "architect",
    displayName: "Architect",
    description: "Architecture creation, critique, and governance",
    readOnly: true,
    requiresApproval: true,
    defaultModel: "auto",
    maxAutonomy: "none",
  },
};
