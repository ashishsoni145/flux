/**
 * @fluxide/protocol - Database Types & Helper Interfaces
 *
 * Generated from Supabase PostgreSQL schema.
 */

import type { Database } from "./database.types.js";

export type { Database, Json } from "./database.types.js";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Strongly-typed entities
export type DbUserProfile = Tables<"user_profiles">;
export type DbOrganization = Tables<"organizations">;
export type DbOrganizationMember = Tables<"organization_members">;
export type DbProject = Tables<"projects">;
export type DbProjectMember = Tables<"project_members">;
export type DbAIProvider = Tables<"ai_providers">;
export type DbAIModel = Tables<"ai_models">;
export type DbSubscription = Tables<"subscriptions">;
export type DbQuotaAccount = Tables<"quota_accounts">;
export type DbUsageEvent = Tables<"usage_events">;
export type DbAIRequest = Tables<"ai_requests">;
export type DbConversation = Tables<"conversations">;
export type DbMessage = Tables<"messages">;
export type DbAgentRun = Tables<"agent_runs">;
export type DbAgentEvent = Tables<"agent_events">;
export type DbAgentPlan = Tables<"agent_plans">;
export type DbAgentCheckpoint = Tables<"agent_checkpoints">;
export type DbVerification = Tables<"verifications">;
export type DbCodeReview = Tables<"code_reviews">;
export type DbProofOfWork = Tables<"proof_of_work">;
export type DbProjectMemory = Tables<"project_memories">;
export type DbProjectRule = Tables<"project_rules">;
export type DbCodeFile = Tables<"code_files">;
export type DbCodeSymbol = Tables<"code_symbols">;
export type DbCodeRelationship = Tables<"code_relationships">;
export type DbGitCommit = Tables<"git_commits">;
export type DbAgentPermission = Tables<"agent_permissions">;
export type DbToolExecution = Tables<"tool_executions">;
export type DbMcpIntegration = Tables<"mcp_integrations">;
export type DbNotification = Tables<"notifications">;
export type DbUserSettings = Tables<"user_settings">;
export type DbSecurityAuditLog = Tables<"security_audit_logs">;
