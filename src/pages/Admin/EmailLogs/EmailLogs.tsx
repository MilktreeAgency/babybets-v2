import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components/DashboardHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Eye, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirm } from '@/contexts/ConfirmDialogContext'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Database } from '@/types/database.types'

type EmailNotificationRow = Database['public']['Tables']['email_notifications']['Row']

interface EmailNotification extends Omit<EmailNotificationRow, 'data' | 'status'> {
  data: Record<string, unknown>
  status: 'pending' | 'sent' | 'failed'
}

const EMAIL_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'prize_win', label: 'Prize Win' },
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'withdrawal_request', label: 'Withdrawal Request' },
  { value: 'withdrawal_approved', label: 'Withdrawal Approved' },
  { value: 'prize_fulfillment', label: 'Prize Fulfillment' },
  { value: 'competition_ending', label: 'Competition Ending' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
]

const getStatusBadge = (status: string) => {
  const badges = {
    pending: { label: 'Pending', color: 'bg-admin-warning-bg text-admin-warning-fg' },
    sent: { label: 'Sent', color: 'bg-admin-success-bg text-admin-success-fg' },
    failed: { label: 'Failed', color: 'bg-admin-error-bg text-admin-error-text' },
  }
  return badges[status as keyof typeof badges] || { label: status, color: 'bg-admin-gray-bg text-admin-gray-text' }
}

export default function EmailLogs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const { confirm } = useConfirm()

  // Transform function to ensure data field is always an object
  const transformEmails = useCallback(async (items: EmailNotificationRow[]): Promise<EmailNotification[]> => {
    return items.map(item => {
      const validStatus: 'pending' | 'sent' | 'failed' =
        (item.status === 'pending' || item.status === 'sent' || item.status === 'failed')
          ? item.status
          : 'pending'

      return {
        ...item,
        data: (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) ? item.data as Record<string, unknown> : {},
        status: validStatus
      }
    })
  }, [])

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return supabase
      .from('email_notifications')
      .select('*')
      .order('created_at', { ascending: false }) as any
  }, [])

  // Use infinite scroll hook
  const {
    data: emails,
    loading,
    loadingMore,
    hasMore,
    refresh,
    observerRef,
  } = useInfiniteScroll<EmailNotificationRow, EmailNotification>({
    queryBuilder,
    pageSize: 10,
    dependencies: [],
    transform: transformEmails,
  })

  // Client-side filtering
  const filteredEmails = useMemo(() => {
    let filtered = [...emails]

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((email) => email.type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((email) => email.status === statusFilter)
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

      filtered = filtered.filter((email) => email.created_at && new Date(email.created_at) >= filterDate)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (email) =>
          email.recipient_email?.toLowerCase().includes(query) ||
          email.type.toLowerCase().includes(query) ||
          email.error_message?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [emails, searchQuery, typeFilter, statusFilter, dateFilter])

  const retryEmail = async (email: EmailNotification) => {
    const confirmed = await confirm({
      title: 'Retry Email',
      description: `Are you sure you want to retry sending this email to ${email.recipient_email}?`,
      confirmText: 'Retry',
      cancelText: 'Cancel',
      variant: 'default',
    })

    if (!confirmed) return

    try {
      setRetrying(true)

      // Update status to pending
      const { error } = await supabase
        .from('email_notifications')
        .update({
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id)

      if (error) throw error

      // Reload emails
      await refresh()

      alert('Email has been queued for retry')
    } catch (error) {
      console.error('Error retrying email:', error)
      alert('Failed to retry email')
    } finally {
      setRetrying(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Type', 'Recipient', 'Status', 'Error', 'Created', 'Sent']
    const rows = filteredEmails.map((email) => [
      email.type,
      email.recipient_email || 'N/A',
      email.status,
      email.error_message || 'N/A',
      email.created_at ? new Date(email.created_at).toLocaleString() : 'N/A',
      email.sent_at ? new Date(email.sent_at).toLocaleString() : 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleRowClick = (email: EmailNotification) => {
    setSelectedEmail(email)
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
          { label: 'Email Logs' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Email Logs</h1>
              <p className="text-muted-foreground mt-1">
                View and manage all email notifications sent from the system
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" className="cursor-pointer">
                <RefreshCw className="size-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="cursor-pointer">
                <Download className="size-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Emails</div>
              <div className="text-2xl font-semibold mt-1">{filteredEmails.length}</div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Sent</div>
              <div className="text-2xl font-semibold mt-1 text-admin-success-fg">
                {filteredEmails.filter((e) => e.status === 'sent').length}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-semibold mt-1 text-admin-warning-fg">
                {filteredEmails.filter((e) => e.status === 'pending').length}
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Failed</div>
              <div className="text-2xl font-semibold mt-1 text-admin-error-text">
                {filteredEmails.filter((e) => e.status === 'failed').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Email Type" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                      {status.label}
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

          {/* Email Logs Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading email logs...</div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground">No email logs found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="bg-admin-card-bg">
                      <th className="text-left p-4 font-medium text-sm">Type</th>
                      <th className="text-left p-4 font-medium text-sm">Recipient</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Created</th>
                      <th className="text-left p-4 font-medium text-sm">Sent</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map((email) => {
                      const statusBadge = getStatusBadge(email.status)
                      return (
                        <tr
                          key={email.id}
                          className="border-b border-border hover:bg-admin-hover-bg transition-colors cursor-pointer"
                          onClick={() => handleRowClick(email)}
                        >
                          <td className="p-4">
                            <div className="font-medium">{email.type}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{email.recipient_email}</div>
                            {email.error_message && (
                              <div className="text-xs text-admin-error-text mt-1 truncate max-w-xs">
                                {email.error_message}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{email.created_at ? formatDate(email.created_at) : 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              {email.created_at ? new Date(email.created_at).toLocaleString() : 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            {email.sent_at ? (
                              <>
                                <div className="text-sm">{formatDate(email.sent_at)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(email.sent_at).toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not sent</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(email)
                                }}
                                className="cursor-pointer"
                              >
                                <Eye className="size-4" />
                              </Button>
                              {email.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    retryEmail(email)
                                  }}
                                  disabled={retrying}
                                  className="cursor-pointer"
                                >
                                  <RefreshCw className="size-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
              <div ref={observerRef} className="p-4 text-center">
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-5 border-2 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of Results Message */}
            {!hasMore && filteredEmails.length > 0 && (
              <div className="p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  All email logs loaded ({filteredEmails.length} total)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Type</div>
                  <div className="font-medium">{selectedEmail.type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusBadge(selectedEmail.status).color
                    }`}
                  >
                    {getStatusBadge(selectedEmail.status).label}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Recipient</div>
                <div className="font-medium">{selectedEmail.recipient_email}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Created</div>
                  <div>{selectedEmail.created_at ? new Date(selectedEmail.created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Sent</div>
                  <div>
                    {selectedEmail.sent_at
                      ? new Date(selectedEmail.sent_at).toLocaleString()
                      : 'Not sent'}
                  </div>
                </div>
              </div>
              {selectedEmail.error_message && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Error Message</div>
                  <div className="bg-admin-error-bg text-admin-error-text p-3 rounded text-sm">
                    {selectedEmail.error_message}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Email Data</div>
                <pre className="bg-admin-hover-bg p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedEmail.data, null, 2)}
                </pre>
              </div>
              {selectedEmail.status === 'failed' && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setDetailDialogOpen(false)
                      retryEmail(selectedEmail)
                    }}
                    disabled={retrying}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="size-4 mr-2" />
                    Retry Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
