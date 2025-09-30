import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('Supabase config:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          image_url: string | null
          token_symbol: string | null
          token_address: string | null
          token_name: string | null
          dex_screener_url: string | null
          is_promoted: boolean
          promotion_start: string | null
          promotion_end: string | null
          promotion_price: number | null
          payment_tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          image_url: string | null
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          is_promoted?: boolean
          promotion_start?: string | null
          promotion_end?: string | null
          promotion_price?: number | null
          payment_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          image_url?: string
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          is_promoted?: boolean
          promotion_start?: string | null
          promotion_end?: string | null
          promotion_price?: number | null
          payment_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      replies: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string | null
          image_url: string | null
          token_symbol: string | null
          token_address: string | null
          token_name: string | null
          dex_screener_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content?: string | null
          image_url?: string | null
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string | null
          image_url?: string | null
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'follow' | 'like' | 'comment'
          actor_id: string
          post_id: string | null
          reply_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'follow' | 'like' | 'comment'
          actor_id: string
          post_id?: string | null
          reply_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'follow' | 'like' | 'comment'
          actor_id?: string
          post_id?: string | null
          reply_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
