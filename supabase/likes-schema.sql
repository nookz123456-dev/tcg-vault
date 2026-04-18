-- Thread likes system
CREATE TABLE IF NOT EXISTS thread_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_thread_likes_thread ON thread_likes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_user ON thread_likes(user_id);

-- RLS policies
ALTER TABLE thread_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "thread_likes_public_read" ON thread_likes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can like
CREATE POLICY "thread_likes_authenticated_insert" ON thread_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "thread_likes_user_delete" ON thread_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Reply likes system
CREATE TABLE IF NOT EXISTS reply_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply ON reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user ON reply_likes(user_id);

-- RLS policies
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reply_likes_public_read" ON reply_likes
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "reply_likes_authenticated_insert" ON reply_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reply_likes_user_delete" ON reply_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);