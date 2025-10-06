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
          referral_code: string | null
          referral_link: string | null
          referred_by: string | null
          pro: boolean
          alpha_chat_enabled: boolean
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
          referral_code?: string | null
          referral_link?: string | null
          referred_by?: string | null
          pro?: boolean
          alpha_chat_enabled?: boolean
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
          referral_code?: string | null
          referral_link?: string | null
          referred_by?: string | null
          pro?: boolean
          alpha_chat_enabled?: boolean
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
          type: 'follow' | 'like' | 'comment' | 'alpha_chat_subscription' | 'payout_available'
          actor_id: string
          post_id: string | null
          reply_id: string | null
          is_read: boolean
          created_at: string
          metadata?: {
            payment_type?: string
            payment_received?: boolean
            amount_sol?: number
            duration?: string
            post_id?: string
            token_title?: string
            recipient_username?: string
            sender_username?: string
            transaction_hash?: string
            payout_amount_sol?: number
            notification_type?: string
            period_start?: string
            period_end?: string
            message?: string
            action_text?: string
          } | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'follow' | 'like' | 'comment' | 'alpha_chat_subscription' | 'payout_available'
          actor_id: string
          post_id?: string | null
          reply_id?: string | null
          is_read?: boolean
          created_at?: string
          metadata?: {
            payment_type?: string
            payment_received?: boolean
            amount_sol?: number
            duration?: string
            post_id?: string
            token_title?: string
            recipient_username?: string
            sender_username?: string
            transaction_hash?: string
            payout_amount_sol?: number
            notification_type?: string
            period_start?: string
            period_end?: string
            message?: string
            action_text?: string
          } | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'follow' | 'like' | 'comment' | 'alpha_chat_subscription'
          actor_id?: string
          post_id?: string | null
          reply_id?: string | null
          is_read?: boolean
          created_at?: string
          metadata?: {
            payment_type?: string
            payment_received?: boolean
            amount_sol?: number
            duration?: string
            post_id?: string
            token_title?: string
            recipient_username?: string
            sender_username?: string
            transaction_hash?: string
            payout_amount_sol?: number
            notification_type?: string
            period_start?: string
            period_end?: string
            message?: string
            action_text?: string
          } | null
        }
      }
      alpha_chat_members: {
        Row: {
          id: string
          alpha_chat_owner_id: string
          subscriber_id: string
          subscription_price_sol: number
          subscription_duration_months: number
          payment_tx_hash: string | null
          status: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at: string
          activated_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          alpha_chat_owner_id: string
          subscriber_id: string
          subscription_price_sol: number
          subscription_duration_months: number
          payment_tx_hash?: string | null
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at?: string
          activated_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          alpha_chat_owner_id?: string
          subscriber_id?: string
          subscription_price_sol?: number
          subscription_duration_months?: number
          payment_tx_hash?: string | null
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          created_at?: string
          activated_at?: string | null
          expires_at?: string | null
        }
      }
      alpha_chat_messages: {
        Row: {
          id: string
          alpha_chat_owner_id: string
          author_id: string
          content: string | null
          image_url: string | null
          token_symbol: string | null
          token_address: string | null
          token_name: string | null
          dex_screener_url: string | null
          fire_count: number | null
          thumbs_down_count: number | null
          diamond_count: number | null
          money_count: number | null
          fire_reacted_by: string[] | null
          thumbs_down_reacted_by: string[] | null
          diamond_reacted_by: string[] | null
          money_reacted_by: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          alpha_chat_owner_id: string
          author_id: string
          content?: string | null
          image_url?: string | null
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          fire_count?: number | null
          thumbs_down_count?: number | null
          diamond_count?: number | null
          money_count?: number | null
          fire_reacted_by?: string[] | null
          thumbs_down_reacted_by?: string[] | null
          diamond_reacted_by?: string[] | null
          money_reacted_by?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          alpha_chat_owner_id?: string
          author_id?: string
          content?: string | null
          image_url?: string | null
          token_symbol?: string | null
          token_address?: string | null
          token_name?: string | null
          dex_screener_url?: string | null
          fire_count?: number | null
          thumbs_down_count?: number | null
          diamond_count?: number | null
          money_count?: number | null
          fire_reacted_by?: string[] | null
          thumbs_down_reacted_by?: string[] | null
          diamond_reacted_by?: string[] | null
          money_reacted_by?: string[] | null
          created_at?: string
          updated_at?: string
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
