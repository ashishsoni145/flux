-- 20260911000009_row_level_security.sql
-- Row Level Security (RLS) Policies for All YourIDE Tables

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_project_accessible(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_project_id
        AND (
            p.owner_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = p_project_id AND pm.user_id = auth.uid())
            OR (p.organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = p.organization_id AND om.user_id = auth.uid()))
        )
    );
$$;

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. organizations
CREATE POLICY "Org members can view org" ON public.organizations
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
    );
CREATE POLICY "Users can create orgs" ON public.organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Org owners and admins can update org" ON public.organizations
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- 3. organization_members
CREATE POLICY "Org members can view member list" ON public.organization_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = organization_members.organization_id AND m.user_id = auth.uid())
    );

-- 4. projects
CREATE POLICY "Project access policy" ON public.projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = projects.organization_id AND om.user_id = auth.uid()))
    );
CREATE POLICY "Project create policy" ON public.projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Project update policy" ON public.projects
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
    );
CREATE POLICY "Project delete policy" ON public.projects
    FOR DELETE USING (owner_id = auth.uid());

-- 5. project_members
CREATE POLICY "Project member view policy" ON public.project_members
    FOR SELECT USING (public.is_project_accessible(project_id));

-- 6. ai_providers & ai_models (Public read-only)
CREATE POLICY "Anyone can view active ai_providers" ON public.ai_providers
    FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active ai_models" ON public.ai_models
    FOR SELECT USING (is_active = true);

-- 7. subscriptions (Client read-only; mutations server-side only)
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- 8. quota_accounts (Client read-only; mutations server-side only)
CREATE POLICY "Users view own quota account" ON public.quota_accounts
    FOR SELECT USING (user_id = auth.uid());

-- 9. usage_events (Client read-only audit log)
CREATE POLICY "Users view own usage events" ON public.usage_events
    FOR SELECT USING (user_id = auth.uid());

-- 10. ai_requests
CREATE POLICY "Users view own ai_requests" ON public.ai_requests
    FOR SELECT USING (user_id = auth.uid());

-- 11. conversations
CREATE POLICY "Users manage own conversations" ON public.conversations
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 12. messages
CREATE POLICY "Users manage messages in own conversations" ON public.messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
    );

-- 13. agent_runs
CREATE POLICY "Users manage own agent runs" ON public.agent_runs
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 14. agent_events
CREATE POLICY "Users view and insert agent events" ON public.agent_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_events.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_events.run_id AND r.user_id = auth.uid())
    );

-- 15. agent_plans
CREATE POLICY "Users manage agent plans" ON public.agent_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_plans.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_plans.run_id AND r.user_id = auth.uid())
    );

-- 16. agent_checkpoints
CREATE POLICY "Users manage own checkpoints" ON public.agent_checkpoints
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 17. verifications
CREATE POLICY "Users access verifications for their runs" ON public.verifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = verifications.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = verifications.run_id AND r.user_id = auth.uid())
    );

-- 18. code_reviews
CREATE POLICY "Users access code reviews for their runs" ON public.code_reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = code_reviews.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = code_reviews.run_id AND r.user_id = auth.uid())
    );

-- 19. proof_of_work
CREATE POLICY "Users access proof of work for their runs" ON public.proof_of_work
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = proof_of_work.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = proof_of_work.run_id AND r.user_id = auth.uid())
    );

-- 20. project_memories
CREATE POLICY "Project memory policy" ON public.project_memories
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

-- 21. project_rules
CREATE POLICY "Project rules policy" ON public.project_rules
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

-- 22. code intelligence (code_files, code_symbols, code_relationships, git_commits)
CREATE POLICY "Code files policy" ON public.code_files
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

CREATE POLICY "Code symbols policy" ON public.code_symbols
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

CREATE POLICY "Code relationships policy" ON public.code_relationships
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

CREATE POLICY "Git commits policy" ON public.git_commits
    FOR ALL USING (public.is_project_accessible(project_id))
    WITH CHECK (public.is_project_accessible(project_id));

-- 23. agent_permissions
CREATE POLICY "Users manage permissions" ON public.agent_permissions
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 24. tool_executions
CREATE POLICY "Users access tool executions for their runs" ON public.tool_executions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = tool_executions.run_id AND r.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = tool_executions.run_id AND r.user_id = auth.uid())
    );

-- 25. mcp_integrations
CREATE POLICY "Users manage MCP integrations" ON public.mcp_integrations
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 26. notifications
CREATE POLICY "Users manage notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 27. user_settings
CREATE POLICY "Users manage settings" ON public.user_settings
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 28. security_audit_logs (Users view own logs)
CREATE POLICY "Users view own audit logs" ON public.security_audit_logs
    FOR SELECT USING (actor_id = auth.uid());
