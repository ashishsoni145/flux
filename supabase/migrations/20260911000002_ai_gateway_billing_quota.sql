-- 20260911000002_ai_gateway_billing_quota.sql
-- AI Providers, Model Registry, Subscriptions, Authoritative Quota Engine, Usage Ledger, and AI Requests

CREATE TABLE IF NOT EXISTS public.ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_base_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    provider_id TEXT REFERENCES public.ai_providers(id) ON DELETE CASCADE NOT NULL,
    model_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    capabilities JSONB DEFAULT '[]'::jsonb NOT NULL,
    context_window INTEGER DEFAULT 128000 NOT NULL,
    pricing_input_1m NUMERIC(10,4) DEFAULT 0.0 NOT NULL,
    pricing_output_1m NUMERIC(10,4) DEFAULT 0.0 NOT NULL,
    pricing_credits_input_1k NUMERIC(10,4) DEFAULT 1.0 NOT NULL,
    pricing_credits_output_1k NUMERIC(10,4) DEFAULT 3.0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_free_tier BOOLEAN DEFAULT false NOT NULL,
    supports_tools BOOLEAN DEFAULT true NOT NULL,
    supports_vision BOOLEAN DEFAULT false NOT NULL,
    supports_reasoning BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    provider TEXT DEFAULT 'stripe' NOT NULL,
    customer_id TEXT,
    subscription_id TEXT,
    current_period_start TIMESTAMPTZ DEFAULT now() NOT NULL,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quota_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
    quota_period TEXT DEFAULT 'monthly' NOT NULL CHECK (quota_period IN ('monthly', 'daily', 'unlimited')),
    allocated_credits BIGINT DEFAULT 100000 NOT NULL,
    used_credits BIGINT DEFAULT 0 NOT NULL,
    remaining_credits BIGINT DEFAULT 100000 NOT NULL,
    reserved_credits BIGINT DEFAULT 0 NOT NULL,
    reset_date TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'exhausted', 'frozen')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT chk_credits_consistency CHECK (remaining_credits + used_credits + reserved_credits >= 0)
);

CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    conversation_id UUID,
    agent_run_id UUID,
    ai_request_id UUID,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0 NOT NULL,
    output_tokens INTEGER DEFAULT 0 NOT NULL,
    total_tokens INTEGER DEFAULT 0 NOT NULL,
    credits_consumed BIGINT DEFAULT 0 NOT NULL,
    provider_cost NUMERIC(12,6) DEFAULT 0.0 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    request_status TEXT DEFAULT 'success' NOT NULL CHECK (request_status IN ('success', 'failed', 'aborted', 'rate_limited')),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    agent_run_id UUID,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    request_status TEXT DEFAULT 'success' NOT NULL CHECK (request_status IN ('success', 'failed', 'timeout', 'cancelled')),
    latency_ms INTEGER DEFAULT 0 NOT NULL,
    input_tokens INTEGER DEFAULT 0 NOT NULL,
    output_tokens INTEGER DEFAULT 0 NOT NULL,
    total_tokens INTEGER DEFAULT 0 NOT NULL,
    credits_consumed BIGINT DEFAULT 0 NOT NULL,
    provider_cost NUMERIC(12,6) DEFAULT 0.0 NOT NULL,
    error_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Standard Providers
INSERT INTO public.ai_providers (id, name, api_base_url, is_active) VALUES
    ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', true),
    ('openai', 'OpenAI', 'https://api.openai.com/v1', true),
    ('anthropic', 'Anthropic', 'https://api.anthropic.com/v1', true),
    ('google', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta', true),
    ('groq', 'Groq', 'https://api.groq.com/openai/v1', true),
    ('cerebras', 'Cerebras', 'https://api.cerebras.ai/v1', true),
    ('mistral', 'Mistral AI', 'https://api.mistral.ai/v1', true),
    ('ollama', 'Ollama (Local)', 'http://localhost:11434', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    api_base_url = EXCLUDED.api_base_url;

-- Seed Standard Core Models
INSERT INTO public.ai_models (id, provider_id, model_name, display_name, capabilities, context_window, pricing_input_1m, pricing_output_1m, pricing_credits_input_1k, pricing_credits_output_1k, is_free_tier, supports_tools, supports_vision, supports_reasoning) VALUES
    ('anthropic/claude-3.7-sonnet', 'anthropic', 'claude-3-7-sonnet-20250219', 'Claude 3.7 Sonnet (Hybrid Reasoning)', '["chat","tools","vision","reasoning"]', 200000, 3.00, 15.00, 3.0, 15.0, false, true, true, true),
    ('anthropic/claude-3.5-sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', '["chat","tools","vision"]', 200000, 3.00, 15.00, 3.0, 15.0, false, true, true, false),
    ('openai/gpt-4o', 'openai', 'gpt-4o', 'GPT-4o Omnimodel', '["chat","tools","vision"]', 128000, 2.50, 10.00, 2.5, 10.0, false, true, true, false),
    ('openai/gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o Mini (Fast)', '["chat","tools","vision"]', 128000, 0.15, 0.60, 0.2, 0.6, true, true, true, false),
    ('google/gemini-2.0-flash', 'google', 'gemini-2.0-flash', 'Gemini 2.0 Flash', '["chat","tools","vision","fast"]', 1048576, 0.10, 0.40, 0.1, 0.4, true, true, true, false),
    ('google/gemini-2.5-pro', 'google', 'gemini-2.5-pro', 'Gemini 2.5 Pro (Ultra Context)', '["chat","tools","vision","reasoning"]', 2097152, 1.25, 5.00, 1.25, 5.0, false, true, true, true),
    ('groq/llama-3.3-70b-versatile', 'groq', 'llama-3.3-70b-versatile', 'Llama 3.3 70B (Ultra Low Latency)', '["chat","tools","fast"]', 128000, 0.59, 0.79, 0.6, 0.8, true, true, false, false),
    ('ollama/deepseek-r1-qwen-7b', 'ollama', 'deepseek-r1:7b', 'DeepSeek R1 7B Local (Free)', '["chat","reasoning","local"]', 32768, 0.0, 0.0, 0.0, 0.0, true, false, false, true)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    context_window = EXCLUDED.context_window,
    is_free_tier = EXCLUDED.is_free_tier;

-- Indexes for performance & auditing
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON public.ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON public.ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_quota_accounts_user ON public.quota_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_time ON public.usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_project ON public.usage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_agent_run ON public.usage_events(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON public.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_agent_run ON public.ai_requests(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON public.ai_requests(created_at DESC);
