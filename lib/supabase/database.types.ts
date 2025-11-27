/**
 * Supabase Database Types
 * Auto-generated types for type-safe database access
 *
 * Generate these types with:
 * npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          tier: 'free' | 'intelligence' | 'apex'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          tier?: 'free' | 'intelligence' | 'apex'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          tier?: 'free' | 'intelligence' | 'apex'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_items: {
        Row: {
          id: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string
          card_number: string | null
          rarity: string | null
          quantity: number
          condition: 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor' | null
          graded: boolean
          grading_company: 'PSA' | 'BGS' | 'CGC' | 'SGC' | null
          grade: number | null
          purchase_price: number | null
          purchase_date: string | null
          notes: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string
          card_number?: string | null
          rarity?: string | null
          quantity?: number
          condition?: 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor' | null
          graded?: boolean
          grading_company?: 'PSA' | 'BGS' | 'CGC' | 'SGC' | null
          grade?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          notes?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          card_name?: string
          set_name?: string
          card_number?: string | null
          rarity?: string | null
          quantity?: number
          condition?: 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor' | null
          graded?: boolean
          grading_company?: 'PSA' | 'BGS' | 'CGC' | 'SGC' | null
          grade?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          notes?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          card_id: string
          card_name: string
          condition: 'raw' | 'psa9' | 'psa10' | 'bgs9' | 'bgs10'
          trigger_type: 'above' | 'below' | 'change_percent'
          target_price: number | null
          percent_change: number | null
          active: boolean
          triggered: boolean
          last_triggered_at: string | null
          last_checked_at: string | null
          notification_method: 'email' | 'push' | 'both'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          card_name: string
          condition: 'raw' | 'psa9' | 'psa10' | 'bgs9' | 'bgs10'
          trigger_type: 'above' | 'below' | 'change_percent'
          target_price?: number | null
          percent_change?: number | null
          active?: boolean
          triggered?: boolean
          last_triggered_at?: string | null
          last_checked_at?: string | null
          notification_method?: 'email' | 'push' | 'both'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          card_name?: string
          condition?: 'raw' | 'psa9' | 'psa10' | 'bgs9' | 'bgs10'
          trigger_type?: 'above' | 'below' | 'change_percent'
          target_price?: number | null
          percent_change?: number | null
          active?: boolean
          triggered?: boolean
          last_triggered_at?: string | null
          last_checked_at?: string | null
          notification_method?: 'email' | 'push' | 'both'
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          portfolio_item_id: string | null
          transaction_type: 'buy' | 'sell' | 'trade'
          quantity: number
          price_per_unit: number
          total_amount: number
          fees: number
          platform: string | null
          notes: string | null
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_item_id?: string | null
          transaction_type: 'buy' | 'sell' | 'trade'
          quantity: number
          price_per_unit: number
          total_amount: number
          fees?: number
          platform?: string | null
          notes?: string | null
          transaction_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_item_id?: string | null
          transaction_type?: 'buy' | 'sell' | 'trade'
          quantity?: number
          price_per_unit?: number
          total_amount?: number
          fees?: number
          platform?: string | null
          notes?: string | null
          transaction_date?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          email_alerts: boolean
          price_alert_threshold: number
          currency: 'USD' | 'EUR' | 'GBP' | 'JPY'
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_alerts?: boolean
          price_alert_threshold?: number
          currency?: 'USD' | 'EUR' | 'GBP' | 'JPY'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_alerts?: boolean
          price_alert_threshold?: number
          currency?: 'USD' | 'EUR' | 'GBP' | 'JPY'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      watchlist_items: {
        Row: {
          id: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string
          target_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string
          target_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          card_name?: string
          set_name?: string
          target_price?: number | null
          notes?: string | null
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
