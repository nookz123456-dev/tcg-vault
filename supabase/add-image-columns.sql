-- Add image_url column to discussion_threads and discussion_replies
ALTER TABLE discussion_threads ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage buckets for image uploads
-- Note: These need to be created via Supabase dashboard or API since SQL can't create storage buckets
-- Insert buckets via API in the upload route instead

-- Add RLS policies for storage buckets (will be created on first upload)
-- The upload API creates buckets automatically if they don't exist