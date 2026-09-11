-- 20260911000007_permissions_tools_mcp_settings_audit.sql
-- Agent Permissions, Tool Executions, MCP Integrations, Notifications, User Settings, and Security Audit Logs

CREATE TABLE IF NOT EXISTS public.agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    command_pattern TEXT,
    permission_type TEXT DEFAULT 'tool_execution' NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN (
        'allow_once', 'always_allow', 'allow_project', 'allow_session', 'always_ask', 'always_deny'
    )),
    scope TEXT DEFAULT 'project' NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    tool_name TEXT NOT NULL,
    tool_type TEXT DEFAULT 'native' NOT NULL,
    input_arguments JSONB DEFAULT '{}'::jsonb NOT NULL,
    output_result JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'success' NOT NULL CHECK (status IN ('success', 'failed', 'blocked', 'timed_out')),
    duration_ms INTEGER DEFAULT 0 NOT NULL,
    permission_id UUID REFERENCES public.agent_permissions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mcp_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    integration_type TEXT NOT NULL,
    name TEXT NOT NULL,
    connection_status TEXT DEFAULT 'active' NOT NULL CHECK (connection_status IN ('active', 'disconnected', 'error', 'pending')),
    server_url TEXT,
    scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark' NOT NULL,
    default_model TEXT DEFAULT 'anthropic/claude-3.5-sonnet' NOT NULL,
    default_agent_mode TEXT DEFAULT 'planning' NOT NULL,
    editor_preferences JSONB DEFAULT '{"fontSize": 14, "tabSize": 2, "wordWrap": "on", "minimap": false}'::jsonb NOT NULL,
    telemetry_enabled BOOLEAN DEFAULT false NOT NULL,
    notification_preferences JSONB DEFAULT '{"email": false, "inApp": true, "quotaAlerts": true}'::jsonb NOT NULL,
    settings_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_permissions_user ON public.agent_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_permissions_project ON public.agent_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_run ON public.tool_executions(run_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool ON public.tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_integrations_user ON public.mcp_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_actor ON public.security_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_time ON public.security_audit_logs(created_at DESC);
