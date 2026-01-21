-- Storage Bucket Setup for Peccy AI
-- Run this AFTER creating the buckets manually in Supabase Dashboard
--
-- Buckets to create:
-- 1. uploads (public = false)
-- 2. generated (public = false)
-- 3. style-references (public = false)

-- =====================================================
-- UPLOADS BUCKET POLICIES
-- Users can upload/view/delete their own files
-- =====================================================

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own uploads
CREATE POLICY "Users can view their uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- GENERATED BUCKET POLICIES
-- Users can view their generated images
-- Only service role can write (from API routes)
-- =====================================================

-- Allow users to view generated images from their sessions
CREATE POLICY "Users can view their generated images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated' AND
  EXISTS (
    SELECT 1 FROM generations g
    WHERE g.user_id = auth.uid()
    AND (storage.foldername(name))[1] = g.id::text
  )
);

-- =====================================================
-- STYLE REFERENCES BUCKET POLICIES
-- Users can upload/view/delete their style references
-- =====================================================

-- Allow users to upload style references
CREATE POLICY "Users can upload style references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'style-references' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their style references
CREATE POLICY "Users can view their style references"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'style-references' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their style references
CREATE POLICY "Users can delete their style references"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'style-references' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
