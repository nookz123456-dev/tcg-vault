-- Add ban_reason column to profiles (if not exists)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add rejection_reason column to seller_profiles (if not exists)
DO $$ BEGIN
  ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create admin_audit_log table (if not exists)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- RLS for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON admin_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);