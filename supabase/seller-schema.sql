-- Seller verification schema
-- Run this in Supabase SQL Editor

-- Seller profiles (extended info for card sellers)
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  -- Identity
  real_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  national_id TEXT NOT NULL, -- เลขบัตรประชาชน
  -- Contact
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL, -- ตำบล/แขวง
  city TEXT NOT NULL, -- อำเภอ/เขต
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Thailand' NOT NULL,
  -- ID verification
  id_card_image_url TEXT, -- รูปบัตรประชาชน
  selfie_with_id_url TEXT, -- รูปถ่ายคู่บัตร
  -- Business info (optional)
  shop_name TEXT,
  shop_description TEXT,
  line_id TEXT,
  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seller ratings (from buyers)
CREATE TABLE IF NOT EXISTS public.seller_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES public.trade_offers(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(buyer_id, trade_id)
);

-- Seller stats (denormalized for performance)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_rating_avg NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_rating_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'none';
-- none = not a seller, pending = applied, verified = verified seller, rejected = rejected, suspended = suspended

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON public.seller_profiles(status);
CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller ON public.seller_ratings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified ON public.seller_profiles(verified_at) WHERE status = 'verified';

-- RLS policies
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view verified seller profiles
CREATE POLICY "Anyone can view verified sellers" ON public.seller_profiles
  FOR SELECT USING (status = 'verified');

-- Sellers can view own profile
CREATE POLICY "Sellers can view own profile" ON public.seller_profiles
  FOR SELECT USING (auth.uid() = id);

-- Authenticated users can create seller profile
CREATE POLICY "Authenticated users can apply" ON public.seller_profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND status = 'pending');

-- Sellers can update own profile (only if pending)
CREATE POLICY "Sellers can update pending profile" ON public.seller_profiles
  FOR UPDATE USING (auth.uid() = id AND status IN ('pending', 'rejected'));

-- Admin can do anything
CREATE POLICY "Admin can manage sellers" ON public.seller_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can view ratings
CREATE POLICY "Anyone can view ratings" ON public.seller_ratings
  FOR SELECT USING (true);

-- Buyers can create ratings (after trade completed)
CREATE POLICY "Buyers can create ratings" ON public.seller_ratings
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Can't modify ratings after posting
CREATE POLICY "No updating ratings" ON public.seller_ratings
  FOR UPDATE USING (false);

CREATE POLICY "No deleting ratings" ON public.seller_ratings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );