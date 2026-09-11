-- 20260911000008_quota_and_auth_functions.sql
-- Authoritative Quota Engine Functions and Automated User Provisioning Trigger

-- 1. Function to atomically reserve AI credits
CREATE OR REPLACE FUNCTION public.reserve_ai_quota(
    p_user_id UUID,
    p_estimated_credits BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account public.quota_accounts%ROWTYPE;
    v_result JSONB;
BEGIN
    IF p_estimated_credits <= 0 THEN
        RAISE EXCEPTION 'Reservation amount must be strictly positive';
    END IF;

    -- Lock row exclusively to prevent concurrent race conditions
    SELECT * INTO v_account
    FROM public.quota_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUOTA_ACCOUNT_NOT_FOUND: No quota account found for user %', p_user_id;
    END IF;

    IF v_account.status != 'active' THEN
        RAISE EXCEPTION 'QUOTA_ACCOUNT_INACTIVE: Quota account status is %', v_account.status;
    END IF;

    IF v_account.remaining_credits < p_estimated_credits THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'QUOTA_EXHAUSTED',
            'allocated_credits', v_account.allocated_credits,
            'remaining_credits', v_account.remaining_credits,
            'reserved_credits', v_account.reserved_credits,
            'requested_credits', p_estimated_credits
        );
    END IF;

    -- Atomically reserve
    UPDATE public.quota_accounts
    SET
        remaining_credits = remaining_credits - p_estimated_credits,
        reserved_credits = reserved_credits + p_estimated_credits,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_account;

    RETURN jsonb_build_object(
        'allowed', true,
        'remaining_credits', v_account.remaining_credits,
        'reserved_credits', v_account.reserved_credits,
        'allocated_credits', v_account.allocated_credits
    );
END;
$$;

-- 2. Function to atomically settle actual AI credit usage
CREATE OR REPLACE FUNCTION public.settle_ai_quota(
    p_user_id UUID,
    p_reserved_credits BIGINT,
    p_actual_credits BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account public.quota_accounts%ROWTYPE;
    v_new_remaining BIGINT;
    v_new_reserved BIGINT;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_account
    FROM public.quota_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUOTA_ACCOUNT_NOT_FOUND: User % has no quota account', p_user_id;
    END IF;

    -- Release the reservation
    v_new_reserved := GREATEST(0, v_account.reserved_credits - p_reserved_credits);
    -- Calculate remaining credits: add back reserved, subtract actual used
    v_new_remaining := GREATEST(0, (v_account.remaining_credits + p_reserved_credits) - p_actual_credits);

    IF v_new_remaining <= 0 THEN
        v_new_status := 'exhausted';
    ELSE
        v_new_status := 'active';
    END IF;

    UPDATE public.quota_accounts
    SET
        reserved_credits = v_new_reserved,
        used_credits = used_credits + p_actual_credits,
        remaining_credits = v_new_remaining,
        status = v_new_status,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_account;

    RETURN jsonb_build_object(
        'success', true,
        'used_credits', v_account.used_credits,
        'remaining_credits', v_account.remaining_credits,
        'reserved_credits', v_account.reserved_credits,
        'status', v_account.status
    );
END;
$$;

-- 3. Automatic user provisioning trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Provision Profile
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Developer'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
    )
    ON CONFLICT (id) DO NOTHING;

    -- Provision User Settings
    INSERT INTO public.user_settings (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- Provision Authoritative Free Quota Account (100,000 credits)
    INSERT INTO public.quota_accounts (user_id, plan, allocated_credits, used_credits, remaining_credits, reserved_credits)
    VALUES (NEW.id, 'free', 100000, 0, 100000, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
