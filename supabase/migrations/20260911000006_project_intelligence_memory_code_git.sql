-- 20260911000006_project_intelligence_memory_code_git.sql
-- Project Intelligence: Persistent Project Memory (pgvector), Rules Engine, Code Index (AST/Symbols/Relations), and Git Intelligence

CREATE TABLE IF NOT EXISTS public.project_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding extensions.vector(1536),
    source TEXT DEFAULT 'manual' NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 1.0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    rule_identifier TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule_content TEXT NOT NULL,
    severity TEXT DEFAULT 'warning' NOT NULL CHECK (severity IN ('hint', 'warning', 'error')),
    applies_to_globs JSONB DEFAULT '["**/*"]'::jsonb NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    source TEXT DEFAULT 'project' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (project_id, rule_identifier)
);

CREATE TABLE IF NOT EXISTS public.code_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    language TEXT,
    content_hash TEXT NOT NULL,
    size_bytes BIGINT DEFAULT 0 NOT NULL,
    indexed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (project_id, file_path)
);

CREATE TABLE IF NOT EXISTS public.code_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES public.code_files(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    symbol_type TEXT NOT NULL CHECK (symbol_type IN (
        'function', 'class', 'interface', 'type', 'variable', 'method', 'constant', 'enum'
    )),
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    documentation TEXT,
    embedding extensions.vector(1536)
);

CREATE TABLE IF NOT EXISTS public.code_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    source_symbol_id UUID REFERENCES public.code_symbols(id) ON DELETE CASCADE NOT NULL,
    target_symbol_id UUID REFERENCES public.code_symbols(id) ON DELETE CASCADE NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'imports', 'calls', 'extends', 'implements', 'references', 'contains', 'tests', 'depends_on'
    ))
);

CREATE TABLE IF NOT EXISTS public.git_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    commit_hash TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    message TEXT NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL,
    files_changed JSONB DEFAULT '[]'::jsonb NOT NULL,
    stats JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (project_id, commit_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_memories_proj ON public.project_memories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memories_cat ON public.project_memories(project_id, category);
CREATE INDEX IF NOT EXISTS idx_project_rules_proj ON public.project_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_code_files_proj ON public.code_files(project_id);
CREATE INDEX IF NOT EXISTS idx_code_symbols_file ON public.code_symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_code_symbols_proj ON public.code_symbols(project_id);
CREATE INDEX IF NOT EXISTS idx_code_symbols_name ON public.code_symbols(name);
CREATE INDEX IF NOT EXISTS idx_code_rel_source ON public.code_relationships(source_symbol_id);
CREATE INDEX IF NOT EXISTS idx_code_rel_target ON public.code_relationships(target_symbol_id);
CREATE INDEX IF NOT EXISTS idx_git_commits_proj ON public.git_commits(project_id);
CREATE INDEX IF NOT EXISTS idx_git_commits_hash ON public.git_commits(commit_hash);
