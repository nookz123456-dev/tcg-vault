-- Add image_url columns to discussion tables
ALTER TABLE discussion_threads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Storage policies for seller-docs bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "seller_docs_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seller-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read seller docs (public)
CREATE POLICY "seller_docs_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'seller-docs');

-- Storage policies for discussion-images bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "discussion_images_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'discussion-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read discussion images (public)
CREATE POLICY "discussion_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'discussion-images');