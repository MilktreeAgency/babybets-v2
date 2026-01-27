export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      competition_instant_win_prizes: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          prize_code: string
          prize_template_id: string
          remaining_quantity: number
          tier: number | null
          total_quantity: number
          updated_at: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          prize_code: string
          prize_template_id: string
          remaining_quantity: number
          tier?: number | null
          total_quantity: number
          updated_at?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          prize_code?: string
          prize_template_id?: string
          remaining_quantity?: number
          tier?: number | null
          total_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_instant_win_prizes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_instant_win_prizes_prize_template_id_fkey"
            columns: ["prize_template_id"]
            isOneToOne: false
            referencedRelation: "prize_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          base_ticket_price_pence: number
          bundles: Json | null
          category: Database["public"]["Enums"]["competition_category"]
          competition_type: Database["public"]["Enums"]["competition_type"]
          created_at: string | null
          description: string
          draw_datetime: string | null
          end_datetime: string
          end_prize: Json | null
          id: string
          image_url: string
          is_featured: boolean | null
          max_tickets: number
          max_tickets_per_user: number | null
          retail_value_gbp: number | null
          show_on_homepage: boolean | null
          slug: string
          start_datetime: string
          status: Database["public"]["Enums"]["competition_status"] | null
          ticket_pool_generated_at: string | null
          ticket_pool_locked: boolean | null
          tickets_sold: number | null
          tiered_pricing: Json | null
          title: string
          total_value_gbp: number
          updated_at: string | null
        }
        Insert: {
          base_ticket_price_pence: number
          bundles?: Json | null
          category: Database["public"]["Enums"]["competition_category"]
          competition_type: Database["public"]["Enums"]["competition_type"]
          created_at?: string | null
          description: string
          draw_datetime?: string | null
          end_datetime: string
          end_prize?: Json | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          max_tickets: number
          max_tickets_per_user?: number | null
          retail_value_gbp?: number | null
          show_on_homepage?: boolean | null
          slug: string
          start_datetime: string
          status?: Database["public"]["Enums"]["competition_status"] | null
          ticket_pool_generated_at?: string | null
          ticket_pool_locked?: boolean | null
          tickets_sold?: number | null
          tiered_pricing?: Json | null
          title: string
          total_value_gbp: number
          updated_at?: string | null
        }
        Update: {
          base_ticket_price_pence?: number
          bundles?: Json | null
          category?: Database["public"]["Enums"]["competition_category"]
          competition_type?: Database["public"]["Enums"]["competition_type"]
          created_at?: string | null
          description?: string
          draw_datetime?: string | null
          end_datetime?: string
          end_prize?: Json | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          max_tickets?: number
          max_tickets_per_user?: number | null
          retail_value_gbp?: number | null
          show_on_homepage?: boolean | null
          slug?: string
          start_datetime?: string
          status?: Database["public"]["Enums"]["competition_status"] | null
          ticket_pool_generated_at?: string | null
          ticket_pool_locked?: boolean | null
          tickets_sold?: number | null
          tiered_pricing?: Json | null
          title?: string
          total_value_gbp?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string | null
          data: Json
          error_message: string | null
          id: string
          recipient_email: string | null
          sent_at: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      influencer_sales: {
        Row: {
          commission_pence: number
          commission_rate: number
          created_at: string | null
          id: string
          influencer_id: string
          order_id: string
          order_value_pence: number
          paid_at: string | null
          status: string | null
        }
        Insert: {
          commission_pence: number
          commission_rate: number
          created_at?: string | null
          id?: string
          influencer_id: string
          order_id: string
          order_value_pence: number
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          commission_pence?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          influencer_id?: string
          order_id?: string
          order_value_pence?: number
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_sales_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          bio: string | null
          commission_tier: number | null
          created_at: string | null
          display_name: string
          featured_competition_id: string | null
          id: string
          is_active: boolean | null
          is_ambassador: boolean | null
          monthly_sales_pence: number | null
          page_bio: string | null
          page_image_url: string | null
          primary_platform: string | null
          profile_image_url: string | null
          slug: string
          social_links: Json | null
          total_commission_pence: number | null
          total_followers: string | null
          total_sales_pence: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          commission_tier?: number | null
          created_at?: string | null
          display_name: string
          featured_competition_id?: string | null
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          monthly_sales_pence?: number | null
          page_bio?: string | null
          page_image_url?: string | null
          primary_platform?: string | null
          profile_image_url?: string | null
          slug: string
          social_links?: Json | null
          total_commission_pence?: number | null
          total_followers?: string | null
          total_sales_pence?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          commission_tier?: number | null
          created_at?: string | null
          display_name?: string
          featured_competition_id?: string | null
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          monthly_sales_pence?: number | null
          page_bio?: string | null
          page_image_url?: string | null
          primary_platform?: string | null
          profile_image_url?: string | null
          slug?: string
          social_links?: Json | null
          total_commission_pence?: number | null
          total_followers?: string | null
          total_sales_pence?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencers_featured_competition_id_fkey"
            columns: ["featured_competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          order_id: string
          price_per_ticket_pence: number
          ticket_count: number
          total_pence: number
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          order_id: string
          price_per_ticket_pence: number
          ticket_count: number
          total_pence: number
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          price_per_ticket_pence?: number
          ticket_count?: number
          total_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          credit_applied_pence: number | null
          discount_pence: number | null
          id: string
          influencer_code: string | null
          influencer_id: string | null
          paid_at: string | null
          promo_code_id: string | null
          promo_code_value: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_pence: number
          total_pence: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_applied_pence?: number | null
          discount_pence?: number | null
          id?: string
          influencer_code?: string | null
          influencer_id?: string | null
          paid_at?: string | null
          promo_code_id?: string | null
          promo_code_value?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence: number
          total_pence: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_applied_pence?: number | null
          discount_pence?: number | null
          id?: string
          influencer_code?: string | null
          influencer_id?: string | null
          paid_at?: string | null
          promo_code_id?: string | null
          promo_code_value?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence?: number
          total_pence?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_promo_code"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_fulfillments: {
        Row: {
          choice: string | null
          claim_deadline: string
          competition_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_address: Json | null
          dispatched_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          prize_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id: string
          tracking_number: string | null
          updated_at: string | null
          user_id: string
          value_pence: number
        }
        Insert: {
          choice?: string | null
          claim_deadline: string
          competition_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          prize_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
          value_pence: number
        }
        Update: {
          choice?: string | null
          claim_deadline?: string
          competition_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          prize_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id?: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
          value_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "prize_fulfillments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_fulfillments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_fulfillments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_templates: {
        Row: {
          cash_alternative_gbp: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          short_name: string | null
          type: Database["public"]["Enums"]["prize_type"]
          updated_at: string | null
          value_gbp: number
        }
        Insert: {
          cash_alternative_gbp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          short_name?: string | null
          type: Database["public"]["Enums"]["prize_type"]
          updated_at?: string | null
          value_gbp: number
        }
        Update: {
          cash_alternative_gbp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          short_name?: string | null
          type?: Database["public"]["Enums"]["prize_type"]
          updated_at?: string | null
          value_gbp?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_email: boolean | null
          marketing_sms: boolean | null
          phone: string | null
          postcode: string | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_email?: boolean | null
          marketing_sms?: boolean | null
          phone?: string | null
          postcode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_email?: boolean | null
          marketing_sms?: boolean | null
          phone?: string | null
          postcode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          competition_ids: string[] | null
          created_at: string | null
          current_uses: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_order_pence: number | null
          new_customers_only: boolean | null
          type: Database["public"]["Enums"]["promo_code_type"]
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          competition_ids?: string[] | null
          created_at?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_pence?: number | null
          new_customers_only?: boolean | null
          type: Database["public"]["Enums"]["promo_code_type"]
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          competition_ids?: string[] | null
          created_at?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_pence?: number | null
          new_customers_only?: boolean | null
          type?: Database["public"]["Enums"]["promo_code_type"]
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      ticket_allocations: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          is_revealed: boolean | null
          is_sold: boolean | null
          order_id: string | null
          prize_id: string | null
          revealed_at: string | null
          sold_at: string | null
          sold_to_user_id: string | null
          ticket_number: string
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          is_sold?: boolean | null
          order_id?: string | null
          prize_id?: string | null
          revealed_at?: string | null
          sold_at?: string | null
          sold_to_user_id?: string | null
          ticket_number: string
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          is_sold?: boolean | null
          order_id?: string | null
          prize_id?: string | null
          revealed_at?: string | null
          sold_at?: string | null
          sold_to_user_id?: string | null
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_allocations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_allocations_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "competition_instant_win_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_allocations_sold_to_user_id_fkey"
            columns: ["sold_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_credits: {
        Row: {
          amount_pence: number
          created_at: string | null
          description: string
          expires_at: string
          id: string
          remaining_pence: number
          source_competition_id: string | null
          source_order_id: string | null
          source_prize_id: string | null
          source_ticket_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["credit_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_pence: number
          created_at?: string | null
          description: string
          expires_at: string
          id?: string
          remaining_pence: number
          source_competition_id?: string | null
          source_order_id?: string | null
          source_prize_id?: string | null
          source_ticket_id?: string | null
          source_type: string
          status?: Database["public"]["Enums"]["credit_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_pence?: number
          created_at?: string | null
          description?: string
          expires_at?: string
          id?: string
          remaining_pence?: number
          source_competition_id?: string | null
          source_order_id?: string | null
          source_prize_id?: string | null
          source_ticket_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["credit_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_credits_source_competition_id_fkey"
            columns: ["source_competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_credits_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_credits_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_pence: number
          balance_after_pence: number
          created_at: string | null
          credit_id: string | null
          description: string
          id: string
          order_id: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Insert: {
          amount_pence: number
          balance_after_pence: number
          created_at?: string | null
          credit_id?: string | null
          description: string
          id?: string
          order_id?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Update: {
          amount_pence?: number
          balance_after_pence?: number
          created_at?: string | null
          credit_id?: string | null
          description?: string
          id?: string
          order_id?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "wallet_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      winners: {
        Row: {
          competition_id: string | null
          created_at: string | null
          display_name: string
          featured: boolean | null
          id: string
          is_public: boolean | null
          location: string | null
          prize_image_url: string | null
          prize_name: string
          prize_value_gbp: number | null
          show_in_ticker: boolean | null
          testimonial: string | null
          ticket_id: string | null
          user_id: string | null
          win_type: string | null
          winner_photo_url: string | null
          won_at: string | null
        }
        Insert: {
          competition_id?: string | null
          created_at?: string | null
          display_name: string
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          prize_image_url?: string | null
          prize_name: string
          prize_value_gbp?: number | null
          show_in_ticker?: boolean | null
          testimonial?: string | null
          ticket_id?: string | null
          user_id?: string | null
          win_type?: string | null
          winner_photo_url?: string | null
          won_at?: string | null
        }
        Update: {
          competition_id?: string | null
          created_at?: string | null
          display_name?: string
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          prize_image_url?: string | null
          prize_name?: string
          prize_value_gbp?: number | null
          show_in_ticker?: boolean | null
          testimonial?: string | null
          ticket_id?: string | null
          user_id?: string | null
          win_type?: string | null
          winner_photo_url?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winners_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount_pence: number
          approved_at: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_details: Json | null
          bank_sort_code: string | null
          created_at: string | null
          id: string
          paid_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_pence: number
          approved_at?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_details?: Json | null
          bank_sort_code?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_pence?: number
          approved_at?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_details?: Json | null
          bank_sort_code?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recent_winners_view: {
        Row: {
          display_name: string | null
          id: string | null
          location: string | null
          prize_image_url: string | null
          prize_name: string | null
          prize_value_gbp: number | null
          won_at: string | null
        }
        Relationships: []
      }
      wallet_balance_view: {
        Row: {
          available_balance_pence: number | null
          expiring_soon_pence: number | null
          next_expiry_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_competition_stats: { Args: { competition_id: string }; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_pending_tasks: { Args: never; Returns: Json }
      get_recent_activities: { Args: { limit_count?: number }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_influencer: { Args: never; Returns: boolean }
    }
    Enums: {
      competition_category:
        | "Toys"
        | "Baby & Nursery"
        | "Cash"
        | "Instant Wins"
        | "Other"
      competition_status:
        | "draft"
        | "scheduled"
        | "active"
        | "ending_soon"
        | "sold_out"
        | "closed"
        | "drawing"
        | "drawn"
        | "completed"
        | "cancelled"
      competition_type:
        | "standard"
        | "instant_win"
        | "instant_win_with_end_prize"
      credit_status: "active" | "spent" | "expired" | "revoked" | "withdrawn"
      fulfillment_status:
        | "pending"
        | "prize_selected"
        | "cash_selected"
        | "processing"
        | "dispatched"
        | "delivered"
        | "completed"
        | "expired"
      order_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      prize_type: "Physical" | "Voucher" | "Cash" | "SiteCredit"
      promo_code_type: "percentage" | "fixed_value" | "free_tickets"
      user_role: "user" | "influencer" | "admin" | "super_admin"
      wallet_transaction_type:
        | "credit"
        | "debit"
        | "expiry"
        | "revocation"
        | "withdrawal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      competition_category: [
        "Toys",
        "Baby & Nursery",
        "Cash",
        "Instant Wins",
        "Other",
      ],
      competition_status: [
        "draft",
        "scheduled",
        "active",
        "ending_soon",
        "sold_out",
        "closed",
        "drawing",
        "drawn",
        "completed",
        "cancelled",
      ],
      competition_type: [
        "standard",
        "instant_win",
        "instant_win_with_end_prize",
      ],
      credit_status: ["active", "spent", "expired", "revoked", "withdrawn"],
      fulfillment_status: [
        "pending",
        "prize_selected",
        "cash_selected",
        "processing",
        "dispatched",
        "delivered",
        "completed",
        "expired",
      ],
      order_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      prize_type: ["Physical", "Voucher", "Cash", "SiteCredit"],
      promo_code_type: ["percentage", "fixed_value", "free_tickets"],
      user_role: ["user", "influencer", "admin", "super_admin"],
      wallet_transaction_type: [
        "credit",
        "debit",
        "expiry",
        "revocation",
        "withdrawal",
      ],
    },
  },
} as const
