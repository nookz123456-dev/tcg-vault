// Supabase database types - will be generated from schema later
// For now, using generic types

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          is_public?: boolean
        }
      }
      collection_cards: {
        Row: {
          id: string
          collection_id: string
          card_id: string
          game: string
          quantity: number
          condition: string
          grade: string | null
          purchase_price: number | null
          acquired_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          card_id: string
          game: string
          quantity?: number
          condition?: string
          grade?: string | null
          purchase_price?: number | null
          acquired_date?: string | null
          notes?: string | null
        }
        Update: {
          quantity?: number
          condition?: string
          grade?: string | null
          purchase_price?: number | null
          acquired_date?: string | null
          notes?: string | null
        }
      }
    }
  }
}