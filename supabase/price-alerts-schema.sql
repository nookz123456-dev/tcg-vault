-- Price Alerts system
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN ('pokemon', 'pokemon-jp', 'onepiece')),
  card_id TEXT NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('below', 'above')),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_target_price CHECK (target_price > 0)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_card ON price_alerts(card_id, game);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "price_alerts_user_read" ON price_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create alerts
CREATE POLICY "price_alerts_user_insert" ON price_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "price_alerts_user_update" ON price_alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "price_alerts_user_delete" ON price_alerts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);