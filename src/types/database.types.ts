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
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          description: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
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
          cash_alternative_gbp: number | null
          category: Database["public"]["Enums"]["competition_category"]
          competition_type: Database["public"]["Enums"]["competition_type"]
          created_at: string | null
          description: string
          draw_datetime: string | null
          end_datetime: string
          end_prize: Json | null
          id: string
          image_url: string
          images: Json | null
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
          cash_alternative_gbp?: number | null
          category: Database["public"]["Enums"]["competition_category"]
          competition_type: Database["public"]["Enums"]["competition_type"]
          created_at?: string | null
          description: string
          draw_datetime?: string | null
          end_datetime: string
          end_prize?: Json | null
          id?: string
          image_url: string
          images?: Json | null
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
          cash_alternative_gbp?: number | null
          category?: Database["public"]["Enums"]["competition_category"]
          competition_type?: Database["public"]["Enums"]["competition_type"]
          created_at?: string | null
          description?: string
          draw_datetime?: string | null
          end_datetime?: string
          end_prize?: Json | null
          id?: string
          image_url?: string
          images?: Json | null
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
      draw_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          competition_id: string | null
          created_at: string | null
          details: Json | null
          draw_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          competition_id?: string | null
          created_at?: string | null
          details?: Json | null
          draw_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          competition_id?: string | null
          created_at?: string | null
          details?: Json | null
          draw_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draw_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_audit_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_audit_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_audit_log_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_snapshots: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          paid_entries: number
          postal_entries: number | null
          promotional_entries: number | null
          snapshot_hash: string
          ticket_ids_json: Json
          total_entries: number
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          id?: string
          paid_entries: number
          postal_entries?: number | null
          promotional_entries?: number | null
          snapshot_hash: string
          ticket_ids_json: Json
          total_entries: number
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          id?: string
          paid_entries?: number
          postal_entries?: number | null
          promotional_entries?: number | null
          snapshot_hash?: string
          ticket_ids_json?: Json
          total_entries?: number
        }
        Relationships: [
          {
            foreignKeyName: "draw_snapshots_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_snapshots_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          competition_id: string
          created_at: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          random_seed: string
          random_source: string | null
          snapshot_id: string
          verification_hash: string
          winner_index: number
          winner_notified_at: string | null
          winning_ticket_id: string | null
          winning_user_id: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          random_seed: string
          random_source?: string | null
          snapshot_id: string
          verification_hash: string
          winner_index: number
          winner_notified_at?: string | null
          winning_ticket_id?: string | null
          winning_user_id?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          random_seed?: string
          random_source?: string | null
          snapshot_id?: string
          verification_hash?: string
          winner_index?: number
          winner_notified_at?: string | null
          winning_ticket_id?: string | null
          winning_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "draw_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winning_ticket_id_fkey"
            columns: ["winning_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winning_user_id_fkey"
            columns: ["winning_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          is_active: boolean | null
          is_ambassador: boolean | null
          monthly_sales_pence: number | null
          page_bio: string | null
          page_image_url: string | null
          primary_platform: string | null
          profile_image_url: string | null
          slug: string
          social_profile_url: string | null
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
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          monthly_sales_pence?: number | null
          page_bio?: string | null
          page_image_url?: string | null
          primary_platform?: string | null
          profile_image_url?: string | null
          slug: string
          social_profile_url?: string | null
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
          id?: string
          is_active?: boolean | null
          is_ambassador?: boolean | null
          monthly_sales_pence?: number | null
          page_bio?: string | null
          page_image_url?: string | null
          primary_platform?: string | null
          profile_image_url?: string | null
          slug?: string
          social_profile_url?: string | null
          total_commission_pence?: number | null
          total_followers?: string | null
          total_sales_pence?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
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
          subtotal_pence?: number
          total_pence?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
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
      payment_transactions: {
        Row: {
          amount_pence: number
          created_at: string
          currency_code: number
          error_message: string | null
          gateway_url: string | null
          id: string
          order_id: string
          request_data: Json | null
          response_code: string | null
          response_data: Json | null
          response_message: string | null
          signature_mismatch_reason: string | null
          signature_verified: boolean | null
          status: string
          transaction_id: string | null
          transaction_unique: string
          user_id: string
        }
        Insert: {
          amount_pence: number
          created_at?: string
          currency_code?: number
          error_message?: string | null
          gateway_url?: string | null
          id?: string
          order_id: string
          request_data?: Json | null
          response_code?: string | null
          response_data?: Json | null
          response_message?: string | null
          signature_mismatch_reason?: string | null
          signature_verified?: boolean | null
          status: string
          transaction_id?: string | null
          transaction_unique: string
          user_id: string
        }
        Update: {
          amount_pence?: number
          created_at?: string
          currency_code?: number
          error_message?: string | null
          gateway_url?: string | null
          id?: string
          order_id?: string
          request_data?: Json | null
          response_code?: string | null
          response_data?: Json | null
          response_message?: string | null
          signature_mismatch_reason?: string | null
          signature_verified?: boolean | null
          status?: string
          transaction_id?: string | null
          transaction_unique?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
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
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          prize_id: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id: string
          tracking_number: string | null
          updated_at: string | null
          user_id: string
          value_pence: number
          voucher_code: string | null
          voucher_description: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          prize_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
          value_pence: number
          voucher_code?: string | null
          voucher_description?: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          prize_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"] | null
          ticket_id?: string
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
          value_pence?: number
          voucher_code?: string | null
          voucher_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_fulfillments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_fulfillments_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_fulfillments_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "competition_instant_win_prizes"
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
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
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
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_allocations: {
        Row: {
          competition_id: string
          created_at: string | null
          id: string
          is_main_winner: boolean | null
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
          is_main_winner?: boolean | null
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
          is_main_winner?: boolean | null
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
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "wallet_credits_source_prize_id_fkey"
            columns: ["source_prize_id"]
            isOneToOne: false
            referencedRelation: "competition_instant_win_prizes"
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
            referencedRelation: "active_competitions_view"
            referencedColumns: ["id"]
          },
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
      active_competitions_view: {
        Row: {
          base_ticket_price_pence: number | null
          bundles: Json | null
          cash_alternative_gbp: number | null
          category: Database["public"]["Enums"]["competition_category"] | null
          competition_type:
            | Database["public"]["Enums"]["competition_type"]
            | null
          created_at: string | null
          description: string | null
          draw_datetime: string | null
          end_datetime: string | null
          end_prize: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          max_tickets: number | null
          max_tickets_per_user: number | null
          remaining_instant_win_prizes: number | null
          retail_value_gbp: number | null
          show_on_homepage: boolean | null
          slug: string | null
          start_datetime: string | null
          status: Database["public"]["Enums"]["competition_status"] | null
          ticket_pool_generated_at: string | null
          ticket_pool_locked: boolean | null
          tickets_sold: number | null
          tiered_pricing: Json | null
          title: string | null
          total_instant_win_prizes: number | null
          total_value_gbp: number | null
          updated_at: string | null
        }
        Relationships: []
      }
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
      allocate_instant_win_prize: {
        Args: { p_ticket_id: string; p_user_id: string }
        Returns: Json
      }
      approve_cash_alternative: {
        Args: { p_admin_id: string; p_fulfillment_id: string }
        Returns: Json
      }
      calculate_commission_tier: {
        Args: { p_monthly_sales_pence: number }
        Returns: number
      }
      check_file_usage: {
        Args: { file_url: string }
        Returns: {
          count: number
          table_name: string
        }[]
      }
      claim_cash_alternative: {
        Args: { p_fulfillment_id: string; p_user_id: string }
        Returns: Json
      }
      claim_tickets_atomic: {
        Args: {
          p_competition_id: string
          p_order_id: string
          p_ticket_count: number
          p_user_id: string
        }
        Returns: {
          id: string
        }[]
      }
      complete_order_with_wallet: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: undefined
      }
      debit_wallet_credits: {
        Args: {
          p_amount_pence: number
          p_description: string
          p_user_id: string
        }
        Returns: undefined
      }
      delete_user: { Args: { user_id: string }; Returns: undefined }
      execute_competition_draw: {
        Args: { p_admin_id: string; p_competition_id: string }
        Returns: Json
      }
      generate_alphanumeric_code: {
        Args: { code_length?: number }
        Returns: string
      }
      generate_random_ticket_numbers: {
        Args: { p_competition_id: string; p_count: number }
        Returns: string[]
      }
      generate_ticket_pool: {
        Args: { p_competition_id: string }
        Returns: Json
      }
      get_commission_rate: { Args: { p_tier: number }; Returns: number }
      get_competition_stats: { Args: { competition_id: string }; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_pending_tasks: { Args: never; Returns: Json }
      get_recent_activities: { Args: { limit_count?: number }; Returns: Json }
      get_system_setting: { Args: { key: string }; Returns: Json }
      get_ticket_pool_stats: {
        Args: { p_competition_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_influencer: { Args: never; Returns: boolean }
      process_withdrawal_payment: {
        Args: { p_withdrawal_id: string }
        Returns: undefined
      }
      recalculate_monthly_commissions: {
        Args: { p_influencer_id: string }
        Returns: undefined
      }
      reset_monthly_influencer_sales: { Args: never; Returns: undefined }
      update_system_setting: {
        Args: { key: string; value: Json }
        Returns: undefined
      }
      verify_draw_integrity: { Args: { p_draw_id: string }; Returns: Json }
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
