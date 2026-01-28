import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import {
  Search,
  Gift,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Banknote,
  MapPin,
  Calendar,
  User,
  Eye,
  Download,
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
  const [fulfillments, setFulfillments] = useState<FulfillmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [choiceFilter, setChoiceFilter] = useState<string>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

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
          competition:competitions!competition_id(title),
          winner:winners!inner(
            prize_name,
            prize_value_gbp,
            win_type
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (choiceFilter !== 'all') {
        query = query.eq('choice', choiceFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data
      const transformedData = (data || []).map((fulfillment) => {
        const user = fulfillment.user as { first_name?: string; last_name?: string; email: string } | null
        const competition = fulfillment.competition as { title: string } | null
        const winner = fulfillment.winner as { prize_name: string; prize_value_gbp?: number; win_type?: string } | null

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
    const badges: Record<FulfillmentStatus, { label: string; color: string; icon: typeof Clock }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      prize_selected: {
        label: 'Prize Selected',
        color: 'bg-blue-100 text-blue-800',
        icon: Package,
      },
      cash_selected: {
        label: 'Cash Selected',
        color: 'bg-purple-100 text-purple-800',
        icon: Banknote,
      },
      processing: { label: 'Processing', color: 'bg-orange-100 text-orange-800', icon: Package },
      dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      delivered: { label: 'Delivered', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: Clock },
    }

    const badge = status ? badges[status] : { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock }
    const Icon = badge.icon
    return { ...badge, icon: <Icon className="size-3" /> }
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

      // Reload data
      await loadFulfillments()
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
                <Gift className="size-6 text-teal-600" />
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
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="size-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Processing</div>
                  <div className="text-2xl font-semibold">{processingCount}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
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
          <div className="bg-white border border-gray-200 rounded-lg p-4">
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

          {/* Fulfillments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full p-8 text-center bg-white rounded-lg border border-gray-200">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading fulfillments...</p>
              </div>
            ) : filteredFulfillments.length === 0 ? (
              <div className="col-span-full p-16 text-center bg-white rounded-lg border border-gray-200">
                <Gift className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No fulfillments found</p>
              </div>
            ) : (
              filteredFulfillments.map((fulfillment) => {
                const badge = getStatusBadge(fulfillment.status)
                const isPhysical = fulfillment.choice === 'physical'

                return (
                  <div
                    key={fulfillment.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-12 rounded-lg flex items-center justify-center ${
                            isPhysical
                              ? 'bg-teal-100 text-teal-600'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {isPhysical ? <Gift className="size-6" /> : <Banknote className="size-6" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {fulfillment.prize_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {fulfillment.competition_title}
                          </p>
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
                      <span className="text-foreground font-medium">
                        {fulfillment.user_name}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{fulfillment.user_email}</span>
                    </div>

                    {/* Prize Value */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                            {isPhysical ? 'Physical Prize' : 'Cash Alternative'}
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            {fulfillment.prize_value_gbp
                              ? `£${fulfillment.prize_value_gbp.toFixed(2)}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <Calendar className="size-4 inline mr-1" />
                          {fulfillment.created_at
                            ? new Date(fulfillment.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {isPhysical && fulfillment.delivery_address && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase mb-2">
                          <MapPin className="size-3" />
                          Delivery Address
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded-lg text-foreground">
                          {typeof fulfillment.delivery_address === 'object' ? (
                            <>
                              <p className="font-medium">
                                {(fulfillment.delivery_address as { fullName?: string }).fullName}
                              </p>
                              <p>
                                {(fulfillment.delivery_address as { line1?: string }).line1}
                              </p>
                              {(fulfillment.delivery_address as { line2?: string }).line2 && (
                                <p>
                                  {(fulfillment.delivery_address as { line2?: string }).line2}
                                </p>
                              )}
                              <p>
                                {(fulfillment.delivery_address as { city?: string }).city},{' '}
                                {(fulfillment.delivery_address as { postcode?: string }).postcode}
                              </p>
                              <p className="text-muted-foreground mt-1">
                                {(fulfillment.delivery_address as { phone?: string }).phone}
                              </p>
                            </>
                          ) : (
                            <p>{String(fulfillment.delivery_address)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tracking Number */}
                    {fulfillment.tracking_number && (
                      <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs text-indigo-600 font-medium uppercase mb-1">
                          Tracking Number
                        </p>
                        <p className="font-mono text-indigo-800 text-sm">
                          {fulfillment.tracking_number}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {fulfillment.notes && (
                      <div className="mb-4 text-sm">
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1">
                          Notes
                        </p>
                        <p className="text-foreground">{fulfillment.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {(fulfillment.status === 'prize_selected' ||
                        fulfillment.status === 'cash_selected') && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(fulfillment.id, 'processing')}
                          disabled={processingId === fulfillment.id}
                        >
                          Mark Processing
                        </Button>
                      )}
                      {fulfillment.status === 'processing' && isPhysical && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const tracking = prompt('Enter tracking number:')
                            if (tracking) {
                              handleUpdateStatus(fulfillment.id, 'dispatched', tracking)
                            }
                          }}
                          disabled={processingId === fulfillment.id}
                          className="cursor-pointer"
                        >
                          <Truck className="size-4 mr-1" />
                          Mark Dispatched
                        </Button>
                      )}
                      {fulfillment.status === 'dispatched' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(fulfillment.id, 'delivered')}
                          disabled={processingId === fulfillment.id}
                        >
                          <CheckCircle className="size-4 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                      {(fulfillment.status === 'delivered' ||
                        (fulfillment.status === 'processing' && !isPhysical)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(fulfillment.id, 'completed')}
                          disabled={processingId === fulfillment.id}
                        >
                          <CheckCircle className="size-4 mr-1" />
                          Mark Completed
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
