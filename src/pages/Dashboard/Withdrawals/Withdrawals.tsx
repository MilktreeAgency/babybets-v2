import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import {
  Search,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/contexts/ConfirmDialogContext'

type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']

interface WithdrawalWithUser extends WithdrawalRequest {
  user_name?: string
  user_email?: string
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { confirm } = useConfirm()

  useEffect(() => {
    loadWithdrawals()
  }, [statusFilter])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles!user_id(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data
      const transformedData = (data || []).map((withdrawal) => {
        const user = withdrawal.user as { first_name?: string; last_name?: string; email: string } | null

        return {
          ...withdrawal,
          user_name: user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          user_email: user?.email || 'N/A',
        }
      })

      setWithdrawals(transformedData)
    } catch (error) {
      console.error('Error loading withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const query = searchQuery.toLowerCase()
    return (
      withdrawal.user_name?.toLowerCase().includes(query) ||
      withdrawal.user_email?.toLowerCase().includes(query) ||
      withdrawal.bank_account_name?.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (status: string | null) => {
    const badges: Record<string, { label: string; color: string; icon: typeof Clock }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const badge = status ? badges[status] : badges.pending
    const Icon = badge.icon
    return { ...badge, icon: <Icon className="size-3" /> }
  }

  const handleApprove = async (id: string) => {
    const confirmed = await confirm({
      title: 'Approve Withdrawal Request?',
      description: 'This will mark the withdrawal as approved and ready for payment.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'default',
    })

    if (!confirmed) return

    try {
      setProcessingId(id)
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await loadWithdrawals()
    } catch (error) {
      console.error('Error approving withdrawal:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    const confirmed = await confirm({
      title: 'Mark Withdrawal as Paid?',
      description: 'This will mark the withdrawal as completed and paid.',
      confirmText: 'Mark as Paid',
      cancelText: 'Cancel',
      variant: 'default',
    })

    if (!confirmed) return

    try {
      setProcessingId(id)
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await loadWithdrawals()
    } catch (error) {
      console.error('Error marking withdrawal as paid:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter a rejection reason:')
    if (!reason) return

    const confirmed = await confirm({
      title: 'Reject Withdrawal Request?',
      description: 'This action cannot be undone. The user will be notified of the rejection.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (!confirmed) return

    try {
      setProcessingId(id)
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id)

      if (error) throw error

      await loadWithdrawals()
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const maskAccountNumber = (accountNumber: string | null) => {
    if (!accountNumber) return 'N/A'
    return `****${accountNumber.slice(-4)}`
  }

  const maskSortCode = (sortCode: string | null) => {
    if (!sortCode) return 'N/A'
    return `**-**-${sortCode.slice(-2)}`
  }

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length
  const approvedCount = withdrawals.filter((w) => w.status === 'approved').length
  const paidCount = withdrawals.filter((w) => w.status === 'paid').length

  const handleExport = () => {
    const csv = [
      [
        'User Name',
        'Email',
        'Amount',
        'Status',
        'Bank Name',
        'Sort Code',
        'Account Number',
        'Requested Date',
        'Paid Date',
      ].join(','),
      ...filteredWithdrawals.map((w) =>
        [
          w.user_name || 'N/A',
          w.user_email || 'N/A',
          `£${(w.amount_pence / 100).toFixed(2)}`,
          w.status || 'pending',
          w.bank_account_name || 'N/A',
          w.bank_sort_code || 'N/A',
          w.bank_account_number || 'N/A',
          w.created_at ? new Date(w.created_at).toLocaleDateString('en-GB') : 'N/A',
          w.paid_at ? new Date(w.paid_at).toLocaleDateString('en-GB') : 'N/A',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Withdrawals' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <DollarSign className="size-6 text-green-600" />
                Withdrawal Requests
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage user withdrawal requests and payments
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredWithdrawals.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </div>

          {/* Info Banner */}
          {approvedCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {approvedCount} withdrawal{approvedCount !== 1 ? 's' : ''} approved and awaiting
                    payment
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    All approved withdrawals should be paid within 48 hours
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="size-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-semibold">{pendingCount}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="size-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">To Pay</div>
                  <div className="text-2xl font-semibold">{approvedCount}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="size-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Paid</div>
                  <div className="text-2xl font-semibold">{paidCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or bank account..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Withdrawals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full p-8 text-center bg-white rounded-lg border border-gray-200">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading withdrawals...</p>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="col-span-full p-16 text-center bg-white rounded-lg border border-gray-200">
                <DollarSign className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No withdrawal requests found</p>
              </div>
            ) : (
              filteredWithdrawals.map((withdrawal) => {
                const badge = getStatusBadge(withdrawal.status)

                return (
                  <div
                    key={withdrawal.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <DollarSign className="size-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            £{(withdrawal.amount_pence / 100).toFixed(2)}
                          </h3>
                          <p className="text-sm text-muted-foreground">Withdrawal Amount</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${badge.color}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">{withdrawal.user_name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{withdrawal.user_email}</span>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase mb-2">
                        <CreditCard className="size-3" />
                        Bank Details
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground font-medium">
                          {withdrawal.bank_account_name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>Sort Code: {maskSortCode(withdrawal.bank_sort_code)}</span>
                          <span>Account: {maskAccountNumber(withdrawal.bank_account_number)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Request Date */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        Requested:{' '}
                        {withdrawal.created_at
                          ? new Date(withdrawal.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>

                    {/* Rejection Reason */}
                    {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-600 font-medium uppercase mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-800">{withdrawal.rejection_reason}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {withdrawal.admin_notes && (
                      <div className="mb-4 text-sm">
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1">
                          Admin Notes
                        </p>
                        <p className="text-foreground">{withdrawal.admin_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                          >
                            <CheckCircle className="size-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                          >
                            <XCircle className="size-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(withdrawal.id)}
                          disabled={processingId === withdrawal.id}
                        >
                          <CheckCircle className="size-4 mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
