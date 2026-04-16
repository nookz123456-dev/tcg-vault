# TCG Vault — Card Collection Tracker

## Database Schema

### Tables

#### `profiles`
- `id` UUID PK (references auth.users)
- `username` TEXT UNIQUE
- `display_name` TEXT
- `avatar_url` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

#### `collections`
- `id` UUID PK DEFAULT gen_random_uuid()
- `user_id` UUID FK → profiles.id
- `name` TEXT (e.g., "Main Collection", "Trade Binder")
- `description` TEXT
- `is_public` BOOLEAN DEFAULT false
- `created_at` TIMESTAMPTZ DEFAULT now()

#### `collection_cards`
- `id` UUID PK DEFAULT gen_random_uuid()
- `collection_id` UUID FK → collections.id
- `card_id` TEXT (external API card ID, e.g., "xy7-54")
- `game` TEXT ('pokemon' | 'onepiece')
- `quantity` INTEGER DEFAULT 1
- `condition` TEXT ('mint' | 'near_mint' | 'excellent' | 'good' | 'light_played' | 'played' | 'poor')
- `grade` TEXT (PSA/BGS grade, nullable)
- `purchase_price` DECIMAL(10,2) nullable
- `acquired_date` DATE nullable
- `notes` TEXT nullable
- `created_at` TIMESTAMPTZ DEFAULT now()

#### `card_prices` (cached from API)
- `id` UUID PK DEFAULT gen_random_uuid()
- `card_id` TEXT
- `game` TEXT
- `price_low` DECIMAL(10,2)
- `price_mid` DECIMAL(10,2)
- `price_high` DECIMAL(10,2)
- `price_market` DECIMAL(10,2)
- `currency` TEXT DEFAULT 'USD'
- `updated_at` TIMESTAMPTZ DEFAULT now()

### Row Level Security
- profiles: users can read all, update own only
- collections: users can read public + own, CRUD own only
- collection_cards: users can read cards in collections they can see, CRUD own only
- card_prices: read-only for all authenticated users

## Pages
- `/` — Landing page with search
- `/search` — Search cards (Pokemon / One Piece)
- `/collection` — My collection dashboard
- `/collection/[id]` — View specific collection
- `/card/[game]/[id]` — Card detail page with price history
- `/auth/login` — Login
- `/auth/signup` — Sign up

## External APIs
- Pokemon TCG API: https://api.pokemontcg.io/v2/ (free, no key needed for basic)
- One Piece API: https://one-piece-api.com/ (RapidAPI key needed)
- Fallback: PriceCharting API for prices