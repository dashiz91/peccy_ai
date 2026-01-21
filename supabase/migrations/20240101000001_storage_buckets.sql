-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uploads', 'uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('generated', 'generated', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('style-references', 'style-references', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- UPLOADS BUCKET POLICIES
-- Users can upload/view/delete their own files

-- Allow users to upload files to their own folder
create policy "Users can upload to their folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own uploads
create policy "Users can view their uploads"
on storage.objects for select
to authenticated
using (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
create policy "Users can delete their uploads"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- GENERATED BUCKET POLICIES
-- Users can view generated images from their sessions
-- Only service role can write (from API routes)

create policy "Users can view their generated images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'generated' and
  exists (
    select 1 from public.generations g
    where g.user_id = auth.uid()
    and (storage.foldername(name))[1] = g.id::text
  )
);

-- STYLE REFERENCES BUCKET POLICIES
-- Users can upload/view/delete their style references

create policy "Users can upload style references"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'style-references' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their style references"
on storage.objects for select
to authenticated
using (
  bucket_id = 'style-references' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their style references"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'style-references' and
  (storage.foldername(name))[1] = auth.uid()::text
);
