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
  type: 'order' | 'win' | 'signup' | 'fulfillment' | 'withdrawal'
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

      // Call all RPC functions in parallel
      const [statsResult, activitiesResult, tasksResult] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.rpc('get_recent_activities', { limit_count: 10 }),
        supabase.rpc('get_pending_tasks'),
      ])

      if (statsResult.error) throw statsResult.error
      if (activitiesResult.error) throw activitiesResult.error
      if (tasksResult.error) throw tasksResult.error

      setStats(statsResult.data as unknown as DashboardStats)
      setActivities(Array.isArray(activitiesResult.data) ? activitiesResult.data as unknown as Activity[] : [])
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
