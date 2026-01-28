import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import {
  Search,
  Gift,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Download,
  Wallet,
  Eye,
  User,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type PrizeFulfillment = Database['public']['Tables']['prize_fulfillments']['Row']
type FulfillmentStatus = Database['public']['Enums']['fulfillment_status']

interface FulfillmentWithDetails extends PrizeFulfillment {
  user_name?: string
  user_email?: string
  competition_title?: string
  prize_name?: string
  prize_type?: string
  prize_value_gbp?: number
}

export default function Fulfillments() {
  const { user } = useAuthStore()
  const [fulfillments, setFulfillments] = useState<FulfillmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [choiceFilter, setChoiceFilter] = useState<string>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentWithDetails | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    loadFulfillments()
  }, [statusFilter, choiceFilter])

  const loadFulfillments = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('prize_fulfillments')
        .select(`
          *,
          user:profiles!user_id(
            first_name,
            last_name,
            email
          ),
          competition:competitions!competition_id(title)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as FulfillmentStatus)
      }

      if (choiceFilter !== 'all') {
        query = query.eq('choice', choiceFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch winners separately by ticket_id
      const ticketIds = (data || [])
        .map((f) => f.ticket_id)
        .filter((id): id is string => !!id)

      let winnersMap: Record<string, { prize_name: string; prize_value_gbp?: number; win_type?: string }> = {}

      if (ticketIds.length > 0) {
        const { data: winnersData } = await supabase
          .from('winners')
          .select('ticket_id, prize_name, prize_value_gbp, win_type')
          .in('ticket_id', ticketIds)

        winnersMap = (winnersData || []).reduce((acc, winner) => {
          if (winner.ticket_id) {
            acc[winner.ticket_id] = {
              prize_name: winner.prize_name,
              prize_value_gbp: winner.prize_value_gbp ?? undefined,
              win_type: winner.win_type ?? undefined,
            }
          }
          return acc
        }, {} as Record<string, { prize_name: string; prize_value_gbp?: number; win_type?: string }>)
      }

      // Transform data
      const transformedData = (data || []).map((fulfillment) => {
        const user = fulfillment.user as { first_name?: string; last_name?: string; email: string } | null
        const competition = fulfillment.competition as { title: string } | null
        const winner = winnersMap[fulfillment.ticket_id]

        return {
          ...fulfillment,
          user_name: user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          user_email: user?.email || 'N/A',
          competition_title: competition?.title || 'Unknown Competition',
          prize_name: winner?.prize_name || 'Unknown Prize',
          prize_value_gbp: winner?.prize_value_gbp,
          prize_type: winner?.win_type,
        }
      })

      setFulfillments(transformedData)
    } catch (error) {
      console.error('Error loading fulfillments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFulfillments = fulfillments.filter((fulfillment) => {
    const query = searchQuery.toLowerCase()
    return (
      fulfillment.user_name?.toLowerCase().includes(query) ||
      fulfillment.user_email?.toLowerCase().includes(query) ||
      fulfillment.prize_name?.toLowerCase().includes(query) ||
      fulfillment.competition_title?.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (status: FulfillmentStatus | null) => {
    const badges: Record<FulfillmentStatus, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      prize_selected: { label: 'Prize Selected', color: 'bg-blue-100 text-blue-800' },
      cash_selected: { label: 'Cash Selected', color: 'bg-purple-100 text-purple-800' },
      processing: { label: 'Processing', color: 'bg-orange-100 text-orange-800' },
      dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Delivered', color: 'bg-teal-100 text-teal-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expired', color: 'bg-red-100 text-red-800' },
    }

    return status ? badges[status] : { label: 'Pending', color: 'bg-gray-100 text-gray-800' }
  }

  const handleApproveCashAlternative = async (fulfillmentId: string, userId: string) => {
    try {
      setProcessingId(fulfillmentId)

      const { data, error } = await supabase.rpc('approve_cash_alternative' as any, {
        p_fulfillment_id: fulfillmentId,
        p_admin_id: userId,
      }) as { data: { amount_gbp: number; expires_at: string } | null; error: any }

      if (error) throw error

      if (data) {
        alert(
          `Cash alternative approved! £${data.amount_gbp} added to user's wallet. Expires: ${new Date(
            data.expires_at
          ).toLocaleDateString()}`
        )
      }

      await loadFulfillments()
      setDetailsOpen(false)
    } catch (error) {
      console.error('Error approving cash alternative:', error)
      alert('Failed to approve cash alternative. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpdateStatus = async (
    id: string,
    newStatus: FulfillmentStatus,
    trackingNumber?: string
  ) => {
    try {
      setProcessingId(id)
      const updates: Partial<PrizeFulfillment> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === 'dispatched') {
        updates.dispatched_at = new Date().toISOString()
        if (trackingNumber) {
          updates.tracking_number = trackingNumber
        }
      }

      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('prize_fulfillments')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await loadFulfillments()
      if (selectedFulfillment?.id === id) {
        const updated = fulfillments.find(f => f.id === id)
        if (updated) setSelectedFulfillment(updated)
      }
    } catch (error) {
      console.error('Error updating fulfillment status:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = fulfillments.filter(
    (f) => f.status === 'pending' || f.status === 'prize_selected' || f.status === 'cash_selected'
  ).length
  const processingCount = fulfillments.filter((f) => f.status === 'processing').length
  const dispatchedCount = fulfillments.filter((f) => f.status === 'dispatched').length

  const handleExport = () => {
    const csv = [
      [
        'User Name',
        'Email',
        'Competition',
        'Prize',
        'Value',
        'Choice',
        'Status',
        'Claimed Date',
        'Tracking Number',
      ].join(','),
      ...filteredFulfillments.map((f) =>
        [
          f.user_name || 'N/A',
          f.user_email || 'N/A',
          f.competition_title || 'N/A',
          f.prize_name || 'N/A',
          f.prize_value_gbp || '0',
          f.choice || 'N/A',
          f.status || 'pending',
          f.created_at ? new Date(f.created_at).toLocaleDateString('en-GB') : 'N/A',
          f.tracking_number || 'N/A',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fulfillments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const openDetails = (fulfillment: FulfillmentWithDetails) => {
    setSelectedFulfillment(fulfillment)
    setDetailsOpen(true)
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Fulfillments' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Gift className="size-6" />
                Prize Fulfillments
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage prize claims and delivery status
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredFulfillments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-lg p-6">
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
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="size-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Processing</div>
                  <div className="text-2xl font-semibold">{processingCount}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Truck className="size-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dispatched</div>
                  <div className="text-2xl font-semibold">{dispatchedCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, prize, email, or competition..."
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
                    <SelectItem value="prize_selected">Prize Selected</SelectItem>
                    <SelectItem value="cash_selected">Cash Selected</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Choice Filter */}
              <div>
                <Select value={choiceFilter} onValueChange={setChoiceFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Choices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Choices</SelectItem>
                    <SelectItem value="physical">Physical Prize</SelectItem>
                    <SelectItem value="cash">Cash Alternative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fulfillments Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-border border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading fulfillments...</p>
              </div>
            ) : filteredFulfillments.length === 0 ? (
              <div className="p-8 text-center">
                <Gift className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No fulfillments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prize
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Claimed
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {filteredFulfillments.map((fulfillment) => {
                      const badge = getStatusBadge(fulfillment.status)
                      const isPhysical = fulfillment.choice === 'physical' || fulfillment.choice === 'prize'

                      return (
                        <tr key={fulfillment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-foreground">
                              {fulfillment.user_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{fulfillment.user_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-foreground">
                              {fulfillment.prize_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {fulfillment.competition_title}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {fulfillment.prize_value_gbp
                              ? `£${fulfillment.prize_value_gbp.toFixed(2)}`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {isPhysical ? (
                                <>
                                  <Gift className="size-3" />
                                  Physical
                                </>
                              ) : (
                                <>
                                  <Wallet className="size-3" />
                                  Cash
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {fulfillment.created_at
                              ? new Date(fulfillment.created_at).toLocaleDateString('en-GB')
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDetails(fulfillment)}
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
                            >
                              <Eye className="size-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0">
          {selectedFulfillment && (
            <>
              <DialogHeader>
                <DialogTitle>Fulfillment Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Information */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="size-4" />
                    User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedFulfillment.user_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedFulfillment.user_email}</p>
                    </div>
                  </div>
                </div>

                {/* Prize Information */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Gift className="size-4" />
                    Prize Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Prize:</span>
                      <p className="font-medium">{selectedFulfillment.prize_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Competition:</span>
                      <p className="font-medium">{selectedFulfillment.competition_title}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Value:</span>
                      <p className="font-medium">£{selectedFulfillment.prize_value_gbp?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">
                        {selectedFulfillment.choice === 'physical' || selectedFulfillment.choice === 'prize'
                          ? 'Physical Prize'
                          : 'Cash Alternative'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusBadge(selectedFulfillment.status).color
                        }`}
                      >
                        {getStatusBadge(selectedFulfillment.status).label}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Claimed:</span>
                      <p className="font-medium">
                        {selectedFulfillment.created_at
                          ? new Date(selectedFulfillment.created_at).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {(selectedFulfillment.choice === 'physical' || selectedFulfillment.choice === 'prize') &&
                  selectedFulfillment.delivery_address && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="size-4" />
                        Delivery Address
                      </h4>
                      <div className="text-sm space-y-1">
                        {typeof selectedFulfillment.delivery_address === 'object' ? (
                          <>
                            <p className="font-medium">
                              {(selectedFulfillment.delivery_address as { fullName?: string }).fullName}
                            </p>
                            <p>{(selectedFulfillment.delivery_address as { line1?: string }).line1}</p>
                            {(selectedFulfillment.delivery_address as { line2?: string }).line2 && (
                              <p>{(selectedFulfillment.delivery_address as { line2?: string }).line2}</p>
                            )}
                            <p>
                              {(selectedFulfillment.delivery_address as { city?: string }).city},{' '}
                              {(selectedFulfillment.delivery_address as { postcode?: string }).postcode}
                            </p>
                            <p className="text-muted-foreground pt-2">
                              {(selectedFulfillment.delivery_address as { phone?: string }).phone}
                            </p>
                          </>
                        ) : (
                          <p>{String(selectedFulfillment.delivery_address)}</p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Tracking Number */}
                {selectedFulfillment.tracking_number && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="size-4" />
                      Tracking Information
                    </h4>
                    <p className="font-mono text-sm">{selectedFulfillment.tracking_number}</p>
                  </div>
                )}

                {/* Cash Alternative Info */}
                {selectedFulfillment.choice === 'cash' &&
                  (selectedFulfillment.status === 'cash_selected' ||
                    selectedFulfillment.status === 'processing') && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wallet className="size-4" />
                        Cash Alternative
                      </h4>
                      <p className="text-sm">
                        Winner selected cash alternative. Approve to add £
                        {selectedFulfillment.prize_value_gbp?.toFixed(2)} to their wallet balance.
                      </p>
                    </div>
                  )}

                {/* Completed Wallet Credit */}
                {selectedFulfillment.choice === 'cash' && selectedFulfillment.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      Wallet Credit Added
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-semibold text-green-700">
                          £{selectedFulfillment.prize_value_gbp?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <p className="font-medium">90 days</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedFulfillment.notes && (
                  <div>
                    <h4 className="font-semibold mb-3">Admin Notes</h4>
                    <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-4">
                      {selectedFulfillment.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-4 border-t border-border">
                  {selectedFulfillment.status === 'prize_selected' &&
                    (selectedFulfillment.choice === 'physical' || selectedFulfillment.choice === 'prize') && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedFulfillment.id, 'processing')}
                        disabled={processingId === selectedFulfillment.id}
                        className="bg-orange-600 hover:bg-orange-700 cursor-pointer"
                      >
                        <Package className="size-4 mr-2" />
                        Start Processing
                      </Button>
                    )}

                  {selectedFulfillment.status === 'processing' &&
                    (selectedFulfillment.choice === 'physical' || selectedFulfillment.choice === 'prize') && (
                      <Button
                        onClick={() => {
                          const tracking = prompt('Enter tracking number:')
                          if (tracking) {
                            handleUpdateStatus(selectedFulfillment.id, 'dispatched', tracking)
                          }
                        }}
                        disabled={processingId === selectedFulfillment.id}
                        className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                      >
                        <Truck className="size-4 mr-2" />
                        Mark Dispatched
                      </Button>
                    )}

                  {(selectedFulfillment.status === 'cash_selected' ||
                    selectedFulfillment.status === 'processing') &&
                    selectedFulfillment.choice === 'cash' &&
                    user?.id && (
                      <Button
                        onClick={() => {
                          if (
                            confirm(
                              `Add £${selectedFulfillment.prize_value_gbp?.toFixed(2)} to ${
                                selectedFulfillment.user_email
                              }'s wallet?`
                            )
                          ) {
                            handleApproveCashAlternative(selectedFulfillment.id, user.id)
                          }
                        }}
                        disabled={processingId === selectedFulfillment.id}
                        className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                      >
                        <Wallet className="size-4 mr-2" />
                        Approve Wallet Credit
                      </Button>
                    )}

                  {selectedFulfillment.status === 'dispatched' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedFulfillment.id, 'delivered')}
                      disabled={processingId === selectedFulfillment.id}
                      className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Mark Delivered
                    </Button>
                  )}

                  {selectedFulfillment.status === 'delivered' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedFulfillment.id, 'completed')}
                      disabled={processingId === selectedFulfillment.id}
                      className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
