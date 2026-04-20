-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'pokemon-jp', 'onepiece')),
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_image TEXT,
  condition TEXT NOT NULL DEFAULT 'nm' CHECK (condition IN ('nm', 'lp', 'mp', 'hp', 'dmg', 'graded')),
  graded_company TEXT,
  graded_grade TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  description TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'paid', 'shipped', 'completed', 'cancelled', 'disputed')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  quantity INTEGER NOT NULL DEFAULT 1,
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order messages (chat between buyer/seller)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_game ON marketplace_listings(game);
CREATE INDEX IF NOT EXISTS idx_listings_active ON marketplace_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_card ON marketplace_listings(card_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created ON marketplace_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_order ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON order_messages(created_at);

-- RLS Policies
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Listings: anyone can read active, sellers can CRUD own
CREATE POLICY "Listings are viewable by everyone" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND seller_status = 'verified'));
CREATE POLICY "Sellers can update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

-- Orders: participants can read, buyers can create, both can update
CREATE POLICY "Order participants can view" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Order participants can update" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages: participants can read/send
CREATE POLICY "Order participants can view messages" ON order_messages FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())));
CREATE POLICY "Order participants can send messages" ON order_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())));

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();