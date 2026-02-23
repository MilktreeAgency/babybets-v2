import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import KPICard from '@/components/admin/KPICard'
import ActivityFeed from '@/components/admin/ActivityFeed'
import PendingTasksWidget from '@/components/admin/PendingTasksWidget'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  revenue: { current: number; previous: number }
  active_competitions: { current: number; previous: number }
  tickets_sold: { current: number; previous: number }
  total_users: { current: number; previous: number }
}

interface Activity {
  id: string
  type: 'order' | 'win' | 'signup' | 'fulfillment' | 'withdrawal' | 'wallet' | 'draw'
  title: string
  description: string
  timestamp: string
  user: { name: string; avatar?: string }
}

interface PendingTasks {
  pending_fulfillments: number
  pending_withdrawals: number
  draft_competitions: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [pendingTasks, setPendingTasks] = useState<PendingTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent activities from activity_logs table
      const { data: activityLogs, error: activityError } = await supabase
        .from('activity_logs')
        .select(`
          id,
          type,
          action,
          description,
          created_at,
          user:profiles!activity_logs_user_id_fkey(first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (activityError) throw activityError

      // Transform activity logs to Activity format
      const transformedActivities: Activity[] = (activityLogs || []).map((log: any) => {
        // Map activity_logs type to ActivityFeed type
        let activityType: Activity['type'] = 'order'
        if (log.type === 'winner') activityType = 'win'
        else if (log.type === 'user') activityType = 'signup'
        else if (log.type === 'order') activityType = 'order'
        else if (log.type === 'fulfillment') activityType = 'fulfillment'
        else if (log.type === 'withdrawal') activityType = 'withdrawal'
        else if (log.type === 'wallet') activityType = 'wallet'
        else if (log.type === 'draw') activityType = 'draw'

        // Format title from type and action
        let title = log.description
        if (log.type === 'order' && log.action === 'created') {
          title = 'New Order'
        } else if (log.type === 'winner') {
          title = 'Competition Won'
        } else if (log.type === 'user') {
          title = 'New User Signup'
        } else if (log.type === 'wallet') {
          title = 'Wallet Credit Added'
        } else if (log.type === 'fulfillment') {
          if (log.action === 'prize_claimed') title = 'Prize Claimed (Physical)'
          else if (log.action === 'cash_claimed') title = 'Prize Claimed (Cash)'
          else if (log.action === 'processing') title = 'Prize Processing'
          else if (log.action === 'dispatched') title = 'Prize Dispatched'
          else if (log.action === 'delivered') title = 'Prize Delivered'
          else if (log.action === 'completed') title = 'Prize Completed'
          else title = 'Prize Fulfillment'
        } else if (log.type === 'withdrawal') {
          if (log.action === 'requested') title = 'Withdrawal Requested'
          else if (log.action === 'approved') title = 'Withdrawal Approved'
          else if (log.action === 'rejected') title = 'Withdrawal Rejected'
          else if (log.action === 'paid') title = 'Withdrawal Paid'
          else title = 'Withdrawal Activity'
        } else if (log.type === 'draw') {
          if (log.action === 'draw_executed') title = 'Draw Executed'
          else if (log.action === 'draw_verified') title = 'Draw Verified'
          else if (log.action === 'draw_cancelled') title = 'Draw Cancelled'
          else title = 'Draw Action'
        }

        return {
          id: log.id,
          type: activityType,
          title,
          description: log.description,
          timestamp: log.created_at,
          user: log.user
            ? {
                name: `${log.user.first_name || ''} ${log.user.last_name || ''}`.trim() || 'Unknown User',
                avatar: log.user.avatar_url || undefined,
              }
            : { name: 'System' },
        }
      })

      // Call RPC functions in parallel
      const [statsResult, tasksResult] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.rpc('get_pending_tasks'),
      ])

      if (statsResult.error) throw statsResult.error
      if (tasksResult.error) throw tasksResult.error

      setStats(statsResult.data as unknown as DashboardStats)
      setActivities(transformedActivities)
      setPendingTasks(tasksResult.data as unknown as PendingTasks)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate KPI changes
  const revenueChange = stats?.revenue.previous
    ? ((stats.revenue.current - stats.revenue.previous) / stats.revenue.previous) * 100
    : 0

  const competitionsChange = stats?.active_competitions.previous
    ? ((stats.active_competitions.current - stats.active_competitions.previous) /
        stats.active_competitions.previous) *
      100
    : 0

  const ticketsChange = stats?.tickets_sold.previous
    ? ((stats.tickets_sold.current - stats.tickets_sold.previous) / stats.tickets_sold.previous) *
      100
    : 0

  const usersChange = stats?.total_users.previous
    ? ((stats.total_users.current - stats.total_users.previous) / stats.total_users.previous) * 100
    : 0

  if (error) {
    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: 'Dashboard' }]} />
        <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="p-6">
            <div className="bg-admin-error-bg border border-admin-error-border rounded-lg p-4">
              <p className="text-admin-error-text">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-2 text-sm text-admin-error-light hover:text-admin-error-text font-medium cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your admin dashboard. Here's what's happening today.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value={`£${((stats?.revenue.current || 0) / 100).toLocaleString('en-GB', {
                minimumFractionDigits: 2,
              })}`}
              change={Math.round(revenueChange * 10) / 10}
              changeLabel="vs last month"
              loading={loading}
            />
            <KPICard
              title="Active Competitions"
              value={stats?.active_competitions.current || 0}
              change={Math.round(competitionsChange * 10) / 10}
              changeLabel="vs last month"
              loading={loading}
            />
            <KPICard
              title="Tickets Sold"
              value={(stats?.tickets_sold.current || 0).toLocaleString('en-GB')}
              change={Math.round(ticketsChange * 10) / 10}
              changeLabel="vs last month"
              loading={loading}
            />
            <KPICard
              title="Total Users"
              value={(stats?.total_users.current || 0).toLocaleString('en-GB')}
              change={Math.round(usersChange * 10) / 10}
              changeLabel="vs last month"
              loading={loading}
            />
          </div>

          {/* Activity Feed and Pending Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed
                activities={activities.map((a) => ({ ...a, timestamp: new Date(a.timestamp) }))}
                loading={loading}
              />
            </div>
            <div>
              <PendingTasksWidget
                tasks={[
                  {
                    id: '1',
                    title: 'Pending Fulfillments',
                    description: 'Winners waiting for prize selection',
                    count: pendingTasks?.pending_fulfillments || 0,
                    href: '/admin/dashboard/fulfillments',
                    urgent: (pendingTasks?.pending_fulfillments || 0) > 0,
                  },
                  {
                    id: '2',
                    title: 'Withdrawal Requests',
                    description: 'Users requesting credit withdrawals',
                    count: pendingTasks?.pending_withdrawals || 0,
                    href: '/admin/dashboard/withdrawals',
                    urgent: (pendingTasks?.pending_withdrawals || 0) > 0,
                  },
                  {
                    id: '3',
                    title: 'Draft Competitions',
                    description: 'Competitions ready to publish',
                    count: pendingTasks?.draft_competitions || 0,
                    href: '/admin/dashboard/competitions',
                    urgent: false,
                  },
                ]}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
