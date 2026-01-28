import type { Database } from './database.types'

// Extend the database types with our custom RPC functions
export interface CustomDatabase extends Database {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: {
          revenue: { current: number; previous: number }
          active_competitions: { current: number; previous: number }
          tickets_sold: { current: number; previous: number }
          total_users: { current: number; previous: number }
        }
      }
      get_recent_activities: {
        Args: { limit_count?: number }
        Returns: Array<{
          id: string
          type: 'order' | 'win' | 'signup' | 'fulfillment' | 'withdrawal'
          title: string
          description: string
          timestamp: string
          user: { name: string; avatar?: string }
        }>
      }
      get_pending_tasks: {
        Args: Record<string, never>
        Returns: {
          pending_fulfillments: number
          pending_withdrawals: number
          draft_competitions: number
        }
      }
      get_competition_stats: {
        Args: { competition_id: string }
        Returns: {
          total_revenue: number
          total_orders: number
          tickets_sold: number
          unique_participants: number
        }
      }
    }
  }
}
