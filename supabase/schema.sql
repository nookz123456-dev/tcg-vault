-- TCG Vault Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Profiles (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. Collections
-- ============================================
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Collection',
  description TEXT,
  is_public BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. Collection Cards
-- ============================================
CREATE TABLE public.collection_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'onepiece')),
  quantity INTEGER DEFAULT 1 NOT NULL,
  condition TEXT DEFAULT 'near_mint' CHECK (condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor')),
  grade TEXT,
  purchase_price DECIMAL(10, 2),
  acquired_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Prevent duplicate cards in same collection with same condition
  UNIQUE(collection_id, card_id, game, condition)
);

-- ============================================
-- 4. Card Prices Cache
-- ============================================
CREATE TABLE public.card_prices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'onepiece')),
  price_low DECIMAL(10, 2),
  price_mid DECIMAL(10, 2),
  price_high DECIMAL(10, 2),
  price_market DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(card_id, game)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collection_cards_collection_id ON public.collection_cards(collection_id);
CREATE INDEX idx_collection_cards_game ON public.collection_cards(game);
CREATE INDEX idx_card_prices_lookup ON public.card_prices(card_id, game);
CREATE INDEX idx_card_prices_updated ON public.card_prices(updated_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Profiles: read all, update own only
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Collections: read public + own, CRUD own only
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public collections are viewable by everyone"
  ON public.collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Cards: read if collection is visible, CRUD own only
ALTER TABLE public.collection_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cards are viewable if collection is public or own"
  ON public.collection_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_cards.collection_id
      AND (collections.is_public = true OR collections.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add cards to own collections"
  ON public.collection_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_cards.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in own collections"
  ON public.collection_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_cards.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards from own collections"
  ON public.collection_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_cards.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Card Prices: read-only for all authenticated users
ALTER TABLE public.card_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prices"
  ON public.card_prices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage prices"
  ON public.card_prices FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();