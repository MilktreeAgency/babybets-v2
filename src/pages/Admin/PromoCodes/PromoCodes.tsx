import { useState, useCallback, useMemo } from 'react'
import { DashboardHeader } from '../components'
import { Plus, Search, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PromoCodeDialog } from './PromoCodeDialog'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeType = Database['public']['Enums']['promo_code_type']

export default function PromoCodes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    let query = supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter as PromoCodeType)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return query as any
  }, [statusFilter, typeFilter])

  // Use infinite scroll hook
  const {
    data: promoCodes,
    loading,
    loadingMore,
    hasMore,
    refresh,
    observerRef,
  } = useInfiniteScroll<PromoCode>({
    queryBuilder,
    pageSize: 10,
    dependencies: [statusFilter, typeFilter],
  })

  // Client-side search filter
  const filteredPromoCodes = useMemo(
    () =>
      promoCodes.filter((promo: PromoCode) =>
        promo.code.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [promoCodes, searchQuery]
  )

  const handleCreateNew = () => {
    setSelectedPromoCode(null)
    setIsCreating(true)
    setDialogOpen(true)
  }

  const handleEdit = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode)
    setIsCreating(false)
    setDialogOpen(true)
  }

  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !promoCode.is_active })
        .eq('id', promoCode.id)

      if (error) throw error
      refresh()
    } catch (error) {
      console.error('Error toggling promo code:', error)
      alert('Failed to update promo code status')
    }
  }

  const getTypeBadge = (type: PromoCodeType) => {
    const badges: Record<PromoCodeType, { label: string; color: string }> = {
      percentage: { label: 'Percentage Off', color: 'bg-admin-info-bg text-admin-info-fg' },
      fixed_value: { label: 'Fixed Amount', color: 'bg-admin-success-bg text-admin-success-fg' },
      free_tickets: { label: 'Free Tickets', color: 'bg-admin-purple-bg text-admin-purple-fg' },
    }
    return badges[type]
  }

  const getValueDisplay = (promoCode: PromoCode) => {
    switch (promoCode.type) {
      case 'percentage':
        return `${promoCode.value}% off`
      case 'fixed_value':
        return `£${(promoCode.value / 100).toFixed(2)} off`
      case 'free_tickets':
        return `${promoCode.value} free tickets`
      default:
        return promoCode.value
    }
  }

  const isExpired = (promoCode: PromoCode) => {
    if (!promoCode.valid_until) return false
    return new Date(promoCode.valid_until) < new Date()
  }

  const isMaxedOut = (promoCode: PromoCode) => {
    if (!promoCode.max_uses) return false
    return (promoCode.current_uses || 0) >= promoCode.max_uses
  }

  const getStatusBadge = (promoCode: PromoCode) => {
    if (!promoCode.is_active) {
      return <span className="text-xs text-muted-foreground">Inactive</span>
    }
    if (isMaxedOut(promoCode)) {
      return <span className="text-xs text-admin-error-text">Max Uses Reached</span>
    }
    if (isExpired(promoCode)) {
      return <span className="text-xs text-admin-error-text">Expired</span>
    }
    return <span className="text-xs text-admin-success-fg">Active</span>
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Promo Codes' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Promo Codes</h1>
              <p className="text-muted-foreground mt-1">
                Manage discount codes, offers, and promotional campaigns
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Create Promo Code
            </button>
          </div>

          {/* Filters */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search promo codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed_value">Fixed Amount</SelectItem>
                    <SelectItem value="free_tickets">Free Tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Promo Codes Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading promo codes...</p>
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No promo codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-admin-hover-bg border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Valid Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPromoCodes.map((promoCode) => {
                      const typeBadge = getTypeBadge(promoCode.type)
                      return (
                        <tr key={promoCode.id} className="hover:bg-admin-hover-bg cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="font-mono font-semibold text-admin-info-fg">
                              {promoCode.code}
                            </div>
                            {promoCode.new_customers_only && (
                              <div className="text-xs text-admin-purple-fg mt-1">New customers only</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.color}`}
                            >
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground font-medium">
                            {getValueDisplay(promoCode)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            <div>
                              {promoCode.current_uses || 0}
                              {promoCode.max_uses && ` / ${promoCode.max_uses}`}
                            </div>
                            {promoCode.max_uses && (
                              <div className="mt-1 w-24 bg-admin-gray-bg rounded-full h-1.5">
                                <div
                                  className="bg-admin-info-fg h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      ((promoCode.current_uses || 0) / promoCode.max_uses) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {promoCode.valid_from || promoCode.valid_until ? (
                              <div className="space-y-1">
                                {promoCode.valid_from && (
                                  <div className="text-xs text-muted-foreground">
                                    From:{' '}
                                    {new Date(promoCode.valid_from).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                )}
                                {promoCode.valid_until && (
                                  <div className="text-xs text-muted-foreground">
                                    Until:{' '}
                                    {new Date(promoCode.valid_until).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No expiry</span>
                            )}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(promoCode)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(promoCode)}
                                className="text-admin-info-fg hover:text-admin-info-text cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(promoCode)}
                                className={
                                  promoCode.is_active
                                    ? 'text-admin-success-fg hover:text-admin-success-text cursor-pointer'
                                    : 'text-muted-foreground hover:text-foreground cursor-pointer'
                                }
                                title={promoCode.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {promoCode.is_active ? (
                                  <ToggleRight className="size-5" />
                                ) : (
                                  <ToggleLeft className="size-5" />
                                )}
                              </button>
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
            {!hasMore && filteredPromoCodes.length > 0 && (
              <div className="p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  All promo codes loaded ({filteredPromoCodes.length} total)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PromoCodeDialog
        promoCode={selectedPromoCode}
        open={dialogOpen}
        isCreating={isCreating}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
      />
    </>
  )
}
