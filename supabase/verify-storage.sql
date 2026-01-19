-- ============================================
-- Verify and Fix Storage Setup
-- Run this to ensure storage is properly configured
-- ============================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'resumes';

-- Check storage policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- If the bucket doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Re-create storage policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_delete" ON storage.objects;

-- Create storage policies
CREATE POLICY "storage_resumes_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT policyname FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'storage_resumes%';
