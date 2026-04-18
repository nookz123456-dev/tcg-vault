-- Create public read policy for jp-card-images bucket
-- Run this in Supabase SQL Editor

-- Policy: Allow public read access to jp-card-images bucket
CREATE POLICY "Public read access for jp-card-images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'jp-card-images');