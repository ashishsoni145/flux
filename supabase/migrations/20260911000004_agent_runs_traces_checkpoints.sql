-- 20260911000004_agent_runs_traces_checkpoints.sql
-- Autonomous Agent Runs, Traces (Events), Plans, and Recoverability Checkpoints

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    goal TEXT NOT NULL,
    status TEXT DEFAULT 'queued' NOT NULL CHECK (status IN (
        'queued', 'planning', 'researching', 'implementing', 'running',
        'verifying', 'reviewing', 'fixing', 'completed', 'failed',
        'cancelled', 'paused', 'waiting_for_approval'
    )),
    agent_type TEXT DEFAULT 'coding' NOT NULL,
    selected_model TEXT REFERENCES public.ai_models(id) ON DELETE SET NULL,
    plan JSONB DEFAULT '{}'::jsonb NOT NULL,
    current_step TEXT,
    start_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    completion_time TIMESTAMPTZ,
    failure_reason TEXT,
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT DEFAULT 'agent' NOT NULL,
    tool TEXT,
    input_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    output_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'success' NOT NULL,
    duration_ms INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    goal TEXT NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb NOT NULL,
    affected_files JSONB DEFAULT '[]'::jsonb NOT NULL,
    dependencies JSONB DEFAULT '[]'::jsonb NOT NULL,
    risks JSONB DEFAULT '[]'::jsonb NOT NULL,
    verification_requirements JSONB DEFAULT '[]'::jsonb NOT NULL,
    required_permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'abandoned', 'superseded')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_checkpoint_id UUID REFERENCES public.agent_checkpoints(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    changed_files JSONB DEFAULT '[]'::jsonb NOT NULL,
    diff_content TEXT,
    git_commit_hash TEXT,
    storage_path TEXT,
    status TEXT DEFAULT 'created' NOT NULL CHECK (status IN ('created', 'accepted', 'rejected', 'rolled_back')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Link agent_run_id in usage_events and ai_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_usage_events_agent_run'
    ) THEN
        ALTER TABLE public.usage_events
        ADD CONSTRAINT fk_usage_events_agent_run
        FOREIGN KEY (agent_run_id) REFERENCES public.agent_runs(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_ai_requests_agent_run'
    ) THEN
        ALTER TABLE public.ai_requests
        ADD CONSTRAINT fk_ai_requests_agent_run
        FOREIGN KEY (agent_run_id) REFERENCES public.agent_runs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_project ON public.agent_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON public.agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_run_time ON public.agent_events(run_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON public.agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_plans_run ON public.agent_plans(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_run ON public.agent_checkpoints(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_project ON public.agent_checkpoints(project_id);
