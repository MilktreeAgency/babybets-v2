import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components/DashboardHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Activity {
  id: string
  type: 'order' | 'win' | 'signup' | 'fulfillment' | 'withdrawal' | 'draw'
  title: string
  description: string
  timestamp: string
  user?: {
    id?: string
    name: string
    email?: string
    avatar?: string
  }
  metadata?: Record<string, unknown>
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'order', label: 'Orders' },
  { value: 'win', label: 'Wins' },
  { value: 'signup', label: 'Signups' },
  { value: 'fulfillment', label: 'Fulfillments' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'draw', label: 'Draws' },
]

const getActivityColor = (type: string) => {
  const colors = {
    order: 'bg-admin-info-bg text-admin-info-fg',
    win: 'bg-admin-success-bg text-admin-success-fg',
    signup: 'bg-admin-purple-bg text-admin-purple-fg',
    fulfillment: 'bg-admin-orange-bg text-admin-orange-fg',
    withdrawal: 'bg-admin-warning-bg text-admin-warning-fg',
    draw: 'bg-admin-gray-bg text-admin-gray-text',
  }
  return colors[type as keyof typeof colors] || 'bg-admin-gray-bg text-admin-gray-text'
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  useEffect(() => {
    filterActivities()
  }, [activities, searchQuery, typeFilter, dateFilter])

  const loadActivities = async () => {
    try {
      setLoading(true)

      const allActivities: Activity[] = []

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          subtotal_pence,
          status,
          created_at,
          user:profiles!orders_user_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (orders) {
        orders.forEach((order) => {
          if (!order.created_at) return
          allActivities.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'New Order',
            description: `Order £${(order.subtotal_pence / 100).toFixed(2)} - ${order.status}`,
            timestamp: order.created_at,
            user: order.user ? {
              id: order.user.id,
              name: `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || 'Unknown User',
              email: order.user.email,
            } : undefined,
            metadata: { orderId: order.id, status: order.status, amount: order.subtotal_pence },
          })
        })
      }

      // Fetch winners
      const { data: winners } = await supabase
        .from('winners')
        .select(`
          id,
          user_id,
          competition_id,
          created_at,
          prize_name,
          prize_value_gbp,
          user:profiles!winners_user_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (winners) {
        winners.forEach((winner) => {
          if (!winner.created_at) return
          allActivities.push({
            id: `win-${winner.id}`,
            type: 'win',
            title: 'Competition Won',
            description: `Won ${winner.prize_name || 'prize'} (£${winner.prize_value_gbp || 0})`,
            timestamp: winner.created_at,
            user: winner.user ? {
              id: winner.user.id,
              name: `${winner.user.first_name || ''} ${winner.user.last_name || ''}`.trim() || 'Unknown User',
              email: winner.user.email,
            } : undefined,
            metadata: { winnerId: winner.id, competitionId: winner.competition_id, prizeName: winner.prize_name },
          })
        })
      }

      // Fetch signups
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (profiles) {
        profiles.forEach((profile) => {
          if (!profile.created_at) return
          allActivities.push({
            id: `signup-${profile.id}`,
            type: 'signup',
            title: 'New User Signup',
            description: `${profile.email} created an account`,
            timestamp: profile.created_at,
            user: {
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
              email: profile.email,
            },
            metadata: { userId: profile.id },
          })
        })
      }

      // Fetch fulfillments
      const { data: fulfillments } = await supabase
        .from('prize_fulfillments')
        .select(`
          id,
          status,
          created_at,
          ticket_id,
          user_id,
          user:profiles!prize_fulfillments_user_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (fulfillments) {
        fulfillments.forEach((fulfillment) => {
          if (!fulfillment.created_at) return
          allActivities.push({
            id: `fulfillment-${fulfillment.id}`,
            type: 'fulfillment',
            title: 'Prize Fulfillment',
            description: `Fulfillment ${fulfillment.status}`,
            timestamp: fulfillment.created_at,
            user: fulfillment.user ? {
              id: fulfillment.user.id,
              name: `${fulfillment.user.first_name || ''} ${fulfillment.user.last_name || ''}`.trim() || 'Unknown User',
              email: fulfillment.user.email,
            } : undefined,
            metadata: { fulfillmentId: fulfillment.id, status: fulfillment.status },
          })
        })
      }

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          status,
          created_at,
          amount_pence,
          user_id,
          user:profiles!withdrawal_requests_user_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (withdrawals) {
        withdrawals.forEach((withdrawal) => {
          if (!withdrawal.created_at) return
          allActivities.push({
            id: `withdrawal-${withdrawal.id}`,
            type: 'withdrawal',
            title: 'Withdrawal Request',
            description: `£${(withdrawal.amount_pence / 100).toFixed(2)} - ${withdrawal.status}`,
            timestamp: withdrawal.created_at,
            user: withdrawal.user ? {
              id: withdrawal.user.id,
              name: `${withdrawal.user.first_name || ''} ${withdrawal.user.last_name || ''}`.trim() || 'Unknown User',
              email: withdrawal.user.email,
            } : undefined,
            metadata: { withdrawalId: withdrawal.id, amount: withdrawal.amount_pence, status: withdrawal.status },
          })
        })
      }

      // Fetch draw audit logs
      const { data: drawLogs } = await supabase
        .from('draw_audit_log')
        .select(`
          id,
          draw_id,
          competition_id,
          action,
          actor_id,
          details,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (drawLogs) {
        drawLogs.forEach((log) => {
          if (!log.created_at) return
          allActivities.push({
            id: `draw-${log.id}`,
            type: 'draw',
            title: 'Draw Action',
            description: `${log.action}: ${log.details || 'No details'}`,
            timestamp: log.created_at,
            metadata: { drawId: log.draw_id, competitionId: log.competition_id, action: log.action },
          })
        })
      }

      // Sort all activities by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(allActivities)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterActivities = () => {
    let filtered = [...activities]

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === typeFilter)
    }

    // Filter by date
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

      filtered = filtered.filter((activity) => new Date(activity.timestamp) >= filterDate)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.user?.name.toLowerCase().includes(query) ||
          activity.user?.email?.toLowerCase().includes(query)
      )
    }

    setFilteredActivities(filtered)
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
              <div className="text-2xl font-semibold mt-1">{filteredActivities.length}</div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Orders</div>
              <div className="text-2xl font-semibold mt-1">
                {filteredActivities.filter((a) => a.type === 'order').length}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Wins</div>
              <div className="text-2xl font-semibold mt-1">
                {filteredActivities.filter((a) => a.type === 'win').length}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Signups</div>
              <div className="text-2xl font-semibold mt-1">
                {filteredActivities.filter((a) => a.type === 'signup').length}
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
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading activities...</div>
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
