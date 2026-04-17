-- Add admin role to profiles table
-- Run this in Supabase SQL Editor

-- Add role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Update admin user role
UPDATE public.profiles SET role = 'admin' WHERE id = '036ac068-3ad7-4912-94b0-cd4a803794a6';

-- Add RLS policy for admin role checking
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verify
SELECT id, username, display_name, role FROM public.profiles WHERE role = 'admin';