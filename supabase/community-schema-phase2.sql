-- TCG Vault Community Schema — Phase 2
-- Run this in Supabase SQL Editor AFTER community-schema.sql

-- ============================================
-- 1. Discussion Boards (forum-style threads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.discussion_boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💬',
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed default boards
INSERT INTO public.discussion_boards (slug, name, description, icon, sort_order) VALUES
  ('pokemon-tcg', 'Pokemon TCG', 'Discuss Pokemon cards, sets, strategies, and pulls', '⚡', 1),
  ('one-piece-tcg', 'One Piece TCG', 'Discuss One Piece cards, decks, and meta', '🏴‍☠️', 2),
  ('market-talk', 'Market Talk', 'Price discussions, market trends, buying and selling tips', '📈', 3),
  ('show-and-tell', 'Show & Tell', 'Show off your collection, rare pulls, and grading results', '✨', 4),
  ('trading-hub', 'Trading Hub', 'Find trade partners, list cards for trade or sale', '🔄', 5),
  ('general', 'General', 'Anything TCG-related that does not fit other boards', '🎯', 6)
ON CONFLICT (slug) DO NOTHING;

-- Discussion Threads (posts within boards)
CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.discussion_boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Discussion Replies (comments on threads)
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.discussion_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 3000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 2. Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'follow',
    'comment_on_card',
    'comment_on_thread',
    'reply_to_thread',
    'wishlist_match',
    'trade_offer',
    'badge_earned',
    'trade_completed'
  )),
  reference_id TEXT,
  reference_type TEXT CHECK (reference_type IN ('card_comment', 'thread', 'reply', 'wishlist', 'trade', 'badge', 'follow')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. Badges
-- ============================================
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('collection', 'social', 'trading', 'special')),
  threshold INTEGER DEFAULT 0 NOT NULL
);

-- Seed badges
INSERT INTO public.badge_definitions (id, name, description, icon, category, threshold) VALUES
  ('first_card', 'First Card', 'Added your first card to your collection', '🃏', 'collection', 1),
  ('collector_10', 'Collector', 'Collected 10 or more cards', '📦', 'collection', 10),
  ('collector_50', 'Serious Collector', 'Collected 50 or more cards', '🏆', 'collection', 50),
  ('collector_100', 'Master Collector', 'Collected 100 or more cards', '👑', 'collection', 100),
  ('first_wishlist', 'Wishlist Maker', 'Added your first card to your wishlist', '💭', 'collection', 1),
  ('first_comment', 'Voice', 'Posted your first comment', '💬', 'social', 1),
  ('first_thread', 'Conversation Starter', 'Created your first discussion thread', '🗣️', 'social', 1),
  ('first_follow', 'Social Butterfly', 'Followed your first collector', '🦋', 'social', 1),
  ('ten_followers', 'Popular', 'Got 10 followers', '⭐', 'social', 10),
  ('first_trade', 'Trader', 'Completed your first trade', '🤝', 'trading', 1),
  ('five_trades', 'Merchant', 'Completed 5 trades', '💰', 'trading', 5),
  ('early_adopter', 'Early Adopter', 'Joined TCG Vault during launch period', '🚀', 'special', 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES public.badge_definitions(id) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- 4. Trade Offers (offer/counter-offer system)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trade_offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offered_card_id TEXT NOT NULL,
  offered_game TEXT NOT NULL CHECK (offered_game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  offered_condition TEXT DEFAULT 'near_mint' CHECK (offered_condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor')),
  requested_card_id TEXT NOT NULL,
  requested_game TEXT NOT NULL CHECK (requested_game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  requested_condition TEXT DEFAULT 'near_mint' CHECK (requested_condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (from_user_id != to_user_id)
);

-- ============================================
-- Indexes for new tables
-- ============================================
CREATE INDEX IF NOT EXISTS idx_threads_board ON public.discussion_threads(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user ON public.discussion_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_thread ON public.discussion_replies(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_replies_user ON public.discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_from ON public.trade_offers(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_offers_to ON public.trade_offers(to_user_id, status);

-- ============================================
-- Row Level Security for new tables
-- ============================================

-- Discussion Boards: public read
ALTER TABLE public.discussion_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boards are viewable by everyone" ON public.discussion_boards FOR SELECT USING (true);

-- Threads: public read, authenticated create
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads are viewable by everyone" ON public.discussion_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.discussion_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Thread authors can update" ON public.discussion_threads FOR UPDATE USING (auth.uid() = user_id);

-- Replies: public read, authenticated create
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies are viewable by everyone" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON public.discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reply authors can update" ON public.discussion_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Reply authors can delete" ON public.discussion_replies FOR DELETE USING (auth.uid() = user_id);

-- Notifications: owner only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Badge Definitions: public read
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badge definitions are viewable by everyone" ON public.badge_definitions FOR SELECT USING (true);

-- User Badges: public read
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- Trade Offers: participants can view, authenticated create
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trade participants can view" ON public.trade_offers FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create trade offers" ON public.trade_offers FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Trade participants can update" ON public.trade_offers FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================
-- Triggers for new tables
-- ============================================

-- Updated_at triggers
CREATE TRIGGER discussion_threads_updated_at
  BEFORE UPDATE ON public.discussion_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER discussion_replies_updated_at
  BEFORE UPDATE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trade_offers_updated_at
  BEFORE UPDATE ON public.trade_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-activity: new thread
CREATE OR REPLACE FUNCTION public.log_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, action, metadata)
  VALUES (NEW.user_id, 'updated_profile', jsonb_build_object('thread_id', NEW.id, 'board_id', NEW.board_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_thread_add ON public.discussion_threads;
CREATE TRIGGER log_thread_add
  AFTER INSERT ON public.discussion_threads
  FOR EACH ROW EXECUTE FUNCTION public.log_thread_activity();

-- Auto-activity: new reply
CREATE OR REPLACE FUNCTION public.log_reply_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, action, metadata)
  VALUES (NEW.user_id, 'posted_comment', jsonb_build_object('thread_id', NEW.thread_id, 'reply_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_reply_add ON public.discussion_replies;
CREATE TRIGGER log_reply_add
  AFTER INSERT ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.log_reply_activity();

-- Auto-notification: reply to your thread
CREATE OR REPLACE FUNCTION public.notify_thread_reply()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, reference_id, reference_type, message)
  SELECT t.user_id, NEW.user_id, 'reply_to_thread', NEW.thread_id::text, 'reply',
    'Someone replied to your thread'
  FROM public.discussion_threads t WHERE t.id = NEW.thread_id AND t.user_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_thread_reply_add ON public.discussion_replies;
CREATE TRIGGER notify_thread_reply_add
  AFTER INSERT ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_thread_reply();

-- Auto-notification: follow
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, reference_id, reference_type, message)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.follower_id::text, 'follow', 'Someone followed you');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_follow_add ON public.follows;
CREATE TRIGGER notify_follow_add
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

-- Auto-badge: check badges on collection change
-- (Simplified — in production this would be more sophisticated)
CREATE OR REPLACE FUNCTION public.check_collection_badges()
RETURNS TRIGGER AS $$
DECLARE
  card_count INTEGER;
  user_id_val UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO user_id_val FROM public.collections WHERE id = NEW.collection_id;
    SELECT COUNT(*) INTO card_count FROM public.collection_cards cc JOIN public.collections c ON c.id = cc.collection_id WHERE c.user_id = user_id_val;

    IF card_count >= 1 THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (user_id_val, 'first_card') ON CONFLICT DO NOTHING;
    END IF;
    IF card_count >= 10 THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (user_id_val, 'collector_10') ON CONFLICT DO NOTHING;
    END IF;
    IF card_count >= 50 THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (user_id_val, 'collector_50') ON CONFLICT DO NOTHING;
    END IF;
    IF card_count >= 100 THEN
      INSERT INTO public.user_badges (user_id, badge_id) VALUES (user_id_val, 'collector_100') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_badges_on_add ON public.collection_cards;
CREATE TRIGGER check_badges_on_add
  AFTER INSERT ON public.collection_cards
  FOR EACH ROW EXECUTE FUNCTION public.check_collection_badges();