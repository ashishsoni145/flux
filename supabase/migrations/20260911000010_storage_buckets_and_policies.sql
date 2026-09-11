-- 20260911000010_storage_buckets_and_policies.sql
-- Storage Buckets for Agent Artifacts and Project Assets with RLS

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('agent-artifacts', 'agent-artifacts', false, 52428800, NULL), -- 50MB limit
    ('project-assets', 'project-assets', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can access their own agent artifacts'
    ) THEN
        CREATE POLICY "Users can access their own agent artifacts"
        ON storage.objects
        FOR ALL
        USING (
            bucket_id IN ('agent-artifacts', 'project-assets')
            AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
        )
        WITH CHECK (
            bucket_id IN ('agent-artifacts', 'project-assets')
            AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
        );
    END IF;
END $$;
