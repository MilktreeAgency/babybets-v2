import { useState, useCallback, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components/DashboardHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

// Manual type definition for activity_logs (types need regeneration)
interface ActivityLog {
  id: string
  user_id: string | null
  actor_id: string | null
  type: string
  action: string
  entity_type: string
  entity_id: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  user?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  }
  actor?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface ActivityStats {
  total: number
  orders: number
  winners: number
  signups: number
}

interface Activity {
  id: string
  type: 'order' | 'winner' | 'signup' | 'fulfillment' | 'withdrawal' | 'draw' | 'user' | 'wallet'
  title: string
  description: string
  timestamp: string
  user?: {
    id?: string
    name: string
    email?: string | null
    avatar?: string
  }
  metadata?: Record<string, unknown>
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'order', label: 'Orders' },
  { value: 'winner', label: 'Wins' },
  { value: 'user', label: 'Signups' },
  { value: 'fulfillment', label: 'Fulfillments' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'wallet', label: 'Wallet Credits' },
  { value: 'draw', label: 'Draws' },
]

const getActivityColor = (type: string) => {
  const colors = {
    order: 'bg-admin-info-bg text-admin-info-fg',
    winner: 'bg-admin-success-bg text-admin-success-fg',
    user: 'bg-admin-purple-bg text-admin-purple-fg',
    fulfillment: 'bg-admin-orange-bg text-admin-orange-fg',
    withdrawal: 'bg-admin-warning-bg text-admin-warning-fg',
    wallet: 'bg-green-100 text-green-800',
    draw: 'bg-admin-gray-bg text-admin-gray-text',
  }
  return colors[type as keyof typeof colors] || 'bg-admin-gray-bg text-admin-gray-text'
}

export default function Activity() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    orders: 0,
    winners: 0,
    signups: 0,
  })

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(id, first_name, last_name, email, avatar_url),
        actor:profiles!activity_logs_actor_id_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      query = query.gte('created_at', filterDate.toISOString())
    }

    return query
  }, [typeFilter, dateFilter])

  // Transform activity logs to Activity interface
  const transformActivities = useCallback(async (logs: ActivityLog[]): Promise<Activity[]> => {
    return logs.map((log) => ({
      id: log.id,
      type: log.type as Activity['type'],
      title: formatActivityTitle(log.type, log.action),
      description: log.description,
      timestamp: log.created_at,
      user: log.user ? {
        id: log.user.id,
        name: `${log.user.first_name || ''} ${log.user.last_name || ''}`.trim() || 'Unknown User',
        email: log.user.email,
        avatar: log.user.avatar_url || undefined,
      } : undefined,
      metadata: log.metadata as Record<string, unknown>,
    }))
  }, [])

  // Use infinite scroll hook with transformation
  const {
    data: activities,
    loading,
    loadingMore,
    hasMore,
    observerRef,
  } = useInfiniteScroll<ActivityLog, Activity>({
    queryBuilder,
    pageSize: 10,
    dependencies: [typeFilter, dateFilter],
    transform: transformActivities,
  })

  // Fetch stats from database (all records matching filters, not just loaded ones)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Helper to build base query with date filter
        const buildQuery = (type?: string) => {
          let query = supabase.from('activity_logs').select('*', { count: 'exact', head: true })

          if (type) {
            query = query.eq('type', type)
          }

          if (dateFilter !== 'all') {
            const now = new Date()
            const filterDate = new Date()

            switch (dateFilter) {
              case 'today':
                filterDate.setHours(0, 0, 0, 0)
                break
              case 'week':
                filterDate.setDate(now.getDate() - 7)
                break
              case 'month':
                filterDate.setMonth(now.getMonth() - 1)
                break
            }

            query = query.gte('created_at', filterDate.toISOString())
          }

          return query
        }

        // Fetch counts in parallel
        const [totalResult, ordersResult, winnersResult, signupsResult] = await Promise.all([
          buildQuery(),
          buildQuery('order'),
          buildQuery('winner'),
          buildQuery('user'),
        ])

        setStats({
          total: totalResult.count || 0,
          orders: ordersResult.count || 0,
          winners: winnersResult.count || 0,
          signups: signupsResult.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [dateFilter])

  // Client-side search filter
  const filteredActivities = useMemo(
    () => {
      if (!searchQuery) return activities

      const query = searchQuery.toLowerCase()
      return activities.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.user?.name.toLowerCase().includes(query) ||
          activity.user?.email?.toLowerCase().includes(query)
      )
    },
    [activities, searchQuery]
  )

  const formatActivityTitle = (type: string, action: string) => {
    // Handle withdrawal-specific actions
    if (type === 'withdrawal') {
      const withdrawalTitles: Record<string, string> = {
        'requested': 'Withdrawal Requested',
        'approved': 'Withdrawal Approved',
        'rejected': 'Withdrawal Rejected',
        'paid': 'Withdrawal Paid',
        'status_changed': 'Withdrawal Updated',
      }
      return withdrawalTitles[action] || 'Withdrawal Activity'
    }

    // Handle fulfillment-specific actions
    if (type === 'fulfillment') {
      const fulfillmentTitles: Record<string, string> = {
        'created': 'Prize Fulfillment Created',
        'prize_claimed': 'Prize Claimed (Physical)',
        'cash_claimed': 'Prize Claimed (Cash)',
        'processing': 'Prize Processing',
        'dispatched': 'Prize Dispatched',
        'delivered': 'Prize Delivered',
        'completed': 'Prize Completed',
        'expired': 'Prize Claim Expired',
        'status_changed': 'Prize Fulfillment Updated',
      }
      return fulfillmentTitles[action] || 'Prize Fulfillment'
    }

    // Handle draw-specific actions
    if (type === 'draw') {
      const drawTitles: Record<string, string> = {
        'draw_executed': 'Draw Executed',
        'draw_verified': 'Draw Verified',
        'draw_cancelled': 'Draw Cancelled',
      }
      return drawTitles[action] || 'Draw Action'
    }

    const titles: Record<string, string> = {
      'order': 'New Order',
      'winner': 'Competition Won',
      'user': 'New User Signup',
      'wallet': 'Wallet Credit Added',
    }
    return titles[type] || `${type} - ${action}`
  }

  const exportToCSV = () => {
    const headers = ['Type', 'Title', 'Description', 'User', 'Email', 'Timestamp']
    const rows = filteredActivities.map((activity) => [
      activity.type,
      activity.title,
      activity.description,
      activity.user?.name || 'N/A',
      activity.user?.email || 'N/A',
      new Date(activity.timestamp).toLocaleString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activities_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleRowClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setDetailDialogOpen(true)
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Activity' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">All Activity</h1>
              <p className="text-muted-foreground mt-1">
                View all system activities including orders, wins, signups, and more
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="cursor-pointer">
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Activities</div>
              <div className="text-2xl font-semibold mt-1">{stats.total}</div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Orders</div>
              <div className="text-2xl font-semibold mt-1">
                {stats.orders}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Wins</div>
              <div className="text-2xl font-semibold mt-1">
                {stats.winners}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Signups</div>
              <div className="text-2xl font-semibold mt-1">
                {stats.signups}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Time</SelectItem>
                  <SelectItem value="today" className="cursor-pointer">Today</SelectItem>
                  <SelectItem value="week" className="cursor-pointer">Last 7 Days</SelectItem>
                  <SelectItem value="month" className="cursor-pointer">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading activities...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground">No activities found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="bg-admin-card-bg">
                      <th className="text-left p-4 font-medium text-sm">Type</th>
                      <th className="text-left p-4 font-medium text-sm">Activity</th>
                      <th className="text-left p-4 font-medium text-sm">User</th>
                      <th className="text-left p-4 font-medium text-sm">Time</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b border-border hover:bg-admin-hover-bg transition-colors cursor-pointer"
                        onClick={() => handleRowClick(activity)}
                      >
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(
                              activity.type
                            )}`}
                          >
                            {activity.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.description}</div>
                        </td>
                        <td className="p-4">
                          {activity.user ? (
                            <div>
                              <div className="font-medium">{activity.user.name}</div>
                              {activity.user.email && (
                                <div className="text-sm text-muted-foreground">{activity.user.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{formatDate(activity.timestamp)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(activity)
                            }}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                  <div ref={observerRef} className="p-4 text-center">
                    {loadingMore && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="size-5 border-2 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Loading more activities...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results Message */}
                {!hasMore && filteredActivities.length > 0 && (
                  <div className="p-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      All activities loaded ({filteredActivities.length} total)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Type</div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(
                    selectedActivity.type
                  )}`}
                >
                  {selectedActivity.type}
                </span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Title</div>
                <div className="font-medium">{selectedActivity.title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <div>{selectedActivity.description}</div>
              </div>
              {selectedActivity.user && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">User</div>
                  <div className="font-medium">{selectedActivity.user.name}</div>
                  {selectedActivity.user.email && (
                    <div className="text-sm text-muted-foreground">{selectedActivity.user.email}</div>
                  )}
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                <div>{new Date(selectedActivity.timestamp).toLocaleString()}</div>
              </div>
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Metadata</div>
                  <pre className="bg-admin-hover-bg p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
