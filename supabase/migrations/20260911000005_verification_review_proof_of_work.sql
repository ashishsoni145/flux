-- 20260911000005_verification_review_proof_of_work.sql
-- Verification, Code Review, and Proof of Work (PoW)

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN (
        'typecheck', 'lint', 'unit_test', 'integration_test', 'build',
        'e2e_test', 'security_check', 'custom'
    )),
    command TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
    exit_code INTEGER,
    output_text TEXT,
    output_storage_path TEXT,
    duration_ms INTEGER DEFAULT 0 NOT NULL,
    test_count INTEGER DEFAULT 0 NOT NULL,
    passed_count INTEGER DEFAULT 0 NOT NULL,
    failed_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.code_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    reviewer_model TEXT NOT NULL,
    review_status TEXT DEFAULT 'completed' NOT NULL CHECK (review_status IN ('pending', 'in_progress', 'completed', 'failed')),
    findings JSONB DEFAULT '[]'::jsonb NOT NULL,
    severity TEXT DEFAULT 'info' NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    affected_files JSONB DEFAULT '[]'::jsonb NOT NULL,
    line_references JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommendation TEXT,
    resolution_status TEXT DEFAULT 'open' NOT NULL CHECK (resolution_status IN ('open', 'addressed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.proof_of_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE NOT NULL UNIQUE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    files_analyzed JSONB DEFAULT '[]'::jsonb NOT NULL,
    files_modified JSONB DEFAULT '[]'::jsonb NOT NULL,
    tests_executed INTEGER DEFAULT 0 NOT NULL,
    tests_passed INTEGER DEFAULT 0 NOT NULL,
    tests_failed INTEGER DEFAULT 0 NOT NULL,
    build_passed BOOLEAN DEFAULT false NOT NULL,
    reviews_summary JSONB DEFAULT '{}'::jsonb NOT NULL,
    security_checks_passed BOOLEAN DEFAULT false NOT NULL,
    remaining_risks JSONB DEFAULT '[]'::jsonb NOT NULL,
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    summary TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verifications_run ON public.verifications(run_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);
CREATE INDEX IF NOT EXISTS idx_code_reviews_run ON public.code_reviews(run_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_severity ON public.code_reviews(severity);
CREATE INDEX IF NOT EXISTS idx_proof_of_work_run ON public.proof_of_work(run_id);
CREATE INDEX IF NOT EXISTS idx_proof_of_work_project ON public.proof_of_work(project_id);
