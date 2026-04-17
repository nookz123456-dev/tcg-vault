-- TCG Vault Community Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Enable autoconfirm via service_role
-- (This is done via Supabase Auth settings, not SQL)
-- ============================================

-- ============================================
-- 2. Update Profiles table for community
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS collection_public BOOLEAN DEFAULT false NOT NULL;

-- ============================================
-- 3. Follows (user follows user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- 4. Card Comments (community discussion per card)
-- ============================================
CREATE TABLE IF NOT EXISTS public.card_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  parent_id UUID REFERENCES public.card_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 5. Wishlists (cards user wants)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, card_id, game)
);

-- ============================================
-- 6. Trade Lists (cards user is willing to trade)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trade_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  condition TEXT DEFAULT 'near_mint' CHECK (condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor')),
  quantity INTEGER DEFAULT 1 NOT NULL,
  asking_price DECIMAL(10, 2),
  is_for_sale BOOLEAN DEFAULT false NOT NULL,
  is_for_trade BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 7. Activity Feed
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'added_to_collection',
    'removed_from_collection',
    'added_to_wishlist',
    'posted_comment',
    'listed_for_trade',
    'followed_user',
    'updated_profile'
  )),
  card_id TEXT,
  game TEXT CHECK (game IN ('pokemon', 'onepiece', 'pokemon-jp')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON public.card_comments(card_id, game);
CREATE INDEX IF NOT EXISTS idx_card_comments_user ON public.card_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_parent ON public.card_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_lists_user ON public.trade_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_action ON public.activities(action);

-- ============================================
-- Row Level Security
-- ============================================

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Card Comments
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON public.card_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.card_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON public.card_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.card_comments FOR DELETE USING (auth.uid() = user_id);

-- Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wishlists are viewable by everyone" ON public.wishlists FOR SELECT USING (true);
CREATE POLICY "Users can add to wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON public.wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Trade Lists
ALTER TABLE public.trade_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trade lists are viewable by everyone" ON public.trade_lists FOR SELECT USING (true);
CREATE POLICY "Users can add to trade list" ON public.trade_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade list" ON public.trade_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from trade list" ON public.trade_lists FOR DELETE USING (auth.uid() = user_id);

-- Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities are viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Users can create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Updated_at triggers for new tables
-- ============================================
CREATE TRIGGER card_comments_updated_at
  BEFORE UPDATE ON public.card_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Auto-add activity on collection card add
-- ============================================
CREATE OR REPLACE FUNCTION public.log_collection_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (user_id, action, card_id, game, metadata)
    VALUES (
      (SELECT user_id FROM public.collections WHERE id = NEW.collection_id),
      'added_to_collection',
      NEW.card_id,
      NEW.game,
      jsonb_build_object('quantity', NEW.quantity, 'condition', NEW.condition)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activities (user_id, action, card_id, game, metadata)
    VALUES (
      (SELECT user_id FROM public.collections WHERE id = OLD.collection_id),
      'removed_from_collection',
      OLD.card_id,
      OLD.game,
      jsonb_build_object('quantity', OLD.quantity)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_collection_add ON public.collection_cards;
DROP TRIGGER IF EXISTS log_collection_remove ON public.collection_cards;

CREATE TRIGGER log_collection_add
  AFTER INSERT ON public.collection_cards
  FOR EACH ROW EXECUTE FUNCTION public.log_collection_activity();

CREATE TRIGGER log_collection_remove
  AFTER DELETE ON public.collection_cards
  FOR EACH ROW EXECUTE FUNCTION public.log_collection_activity();

-- ============================================
-- Auto-add activity on wishlist add
-- ============================================
CREATE OR REPLACE FUNCTION public.log_wishlist_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, action, card_id, game, metadata)
  VALUES (NEW.user_id, 'added_to_wishlist', NEW.card_id, NEW.game, jsonb_build_object('priority', NEW.priority));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_wishlist_add ON public.wishlists;
CREATE TRIGGER log_wishlist_add
  AFTER INSERT ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.log_wishlist_activity();

-- ============================================
-- Auto-add activity on trade list add
-- ============================================
CREATE OR REPLACE FUNCTION public.log_trade_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, action, card_id, game, metadata)
  VALUES (NEW.user_id, 'listed_for_trade', NEW.card_id, NEW.game, jsonb_build_object('for_trade', NEW.is_for_trade, 'for_sale', NEW.is_for_sale));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_trade_add ON public.trade_lists;
CREATE TRIGGER log_trade_add
  AFTER INSERT ON public.trade_lists
  FOR EACH ROW EXECUTE FUNCTION public.log_trade_activity();