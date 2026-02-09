import { useState, useCallback, useMemo } from 'react'
import { DashboardHeader } from '../components'
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PrizeDialog } from './PrizeDialog'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

type PrizeTemplate = Database['public']['Tables']['prize_templates']['Row']
type PrizeType = Database['public']['Enums']['prize_type']

export default function Prizes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedPrize, setSelectedPrize] = useState<PrizeTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    let query = supabase
      .from('prize_templates')
      .select('*')
      .order('value_gbp', { ascending: false })

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter as PrizeType)
    }

    return query
  }, [statusFilter, typeFilter])

  // Use infinite scroll hook
  const {
    data: prizes,
    loading,
    loadingMore,
    hasMore,
    refresh,
    observerRef,
  } = useInfiniteScroll<PrizeTemplate>({
    queryBuilder,
    pageSize: 10,
    dependencies: [statusFilter, typeFilter],
  })

  // Client-side search filter
  const filteredPrizes = useMemo(
    () =>
      prizes.filter((prize) =>
        prize.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [prizes, searchQuery]
  )

  const handleCreateNew = () => {
    setSelectedPrize(null)
    setIsCreating(true)
    setDialogOpen(true)
  }

  const handleEdit = (prize: PrizeTemplate) => {
    setSelectedPrize(prize)
    setIsCreating(false)
    setDialogOpen(true)
  }

  const handleToggleActive = async (prize: PrizeTemplate) => {
    try {
      const { error } = await supabase
        .from('prize_templates')
        .update({ is_active: !prize.is_active })
        .eq('id', prize.id)

      if (error) throw error
      refresh()
    } catch (error) {
      console.error('Error toggling prize status:', error)
      alert('Failed to update prize status')
    }
  }

  const handleDelete = async (prize: PrizeTemplate) => {
    // Check if prize is used in any competitions
    const { data: usageData } = await supabase
      .from('competition_instant_win_prizes')
      .select('competition_id')
      .eq('prize_template_id', prize.id)
      .limit(1)

    if (usageData && usageData.length > 0) {
      alert('Cannot delete prize that is used in competitions. Please remove it from competitions first.')
      return
    }

    if (!confirm(`Are you sure you want to delete "${prize.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('prize_templates')
        .delete()
        .eq('id', prize.id)

      if (error) throw error
      refresh()
    } catch (error) {
      console.error('Error deleting prize:', error)
      alert('Failed to delete prize')
    }
  }

  const getTypeBadge = (type: PrizeType) => {
    const badges = {
      Physical: { label: 'Physical', color: 'bg-admin-info-bg text-admin-info-fg', icon: Package },
      Voucher: { label: 'Voucher', color: 'bg-admin-success-bg text-admin-success-fg', icon: Package },
      Cash: { label: 'Cash', color: 'bg-admin-purple-bg text-admin-purple-fg', icon: Package },
      SiteCredit: { label: 'Site Credit', color: 'bg-admin-orange-bg text-admin-orange-fg', icon: Package },
    }
    return badges[type]
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Prize Library' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Prize Library</h1>
              <p className="text-muted-foreground mt-1">
                Manage reusable prize templates for competitions
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-info-fg text-white rounded-lg hover:bg-admin-info-text transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Create Prize
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
                    placeholder="Search prizes..."
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
                    <SelectItem value="Physical">Physical</SelectItem>
                    <SelectItem value="Voucher">Voucher</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="SiteCredit">Site Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prizes Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading prizes...</p>
              </div>
            ) : filteredPrizes.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="size-12 text-admin-gray-bg mx-auto mb-3" />
                <p className="text-muted-foreground">No prizes found</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 text-admin-info-fg hover:text-admin-info-text text-sm font-medium cursor-pointer"
                >
                  Create your first prize
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-admin-hover-bg border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Prize
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cash Alternative
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
                    {filteredPrizes.map((prize) => {
                      const typeBadge = getTypeBadge(prize.type)
                      return (
                        <tr key={prize.id} className="hover:bg-admin-hover-bg cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {prize.image_url && (
                                <img
                                  src={prize.image_url}
                                  alt={prize.name}
                                  className="size-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium text-foreground">{prize.name}</div>
                                {prize.short_name && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {prize.short_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.color}`}
                            >
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground font-medium">
                            £{prize.value_gbp.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {prize.cash_alternative_gbp ? (
                              `£${prize.cash_alternative_gbp.toFixed(2)}`
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {prize.is_active ? (
                              <span className="text-xs text-admin-success-fg">Active</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Inactive</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(prize)}
                                className="text-admin-info-fg hover:text-admin-info-text cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(prize)}
                                className={
                                  prize.is_active
                                    ? 'text-admin-success-fg hover:text-admin-success-text cursor-pointer'
                                    : 'text-muted-foreground hover:text-foreground cursor-pointer'
                                }
                                title={prize.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {prize.is_active ? (
                                  <ToggleRight className="size-5" />
                                ) : (
                                  <ToggleLeft className="size-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(prize)}
                                className="text-admin-error-text hover:text-admin-error-light cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="size-4" />
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
            {!hasMore && filteredPrizes.length > 0 && (
              <div className="p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  All prizes loaded ({filteredPrizes.length} total)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PrizeDialog
        prize={selectedPrize}
        open={dialogOpen}
        isCreating={isCreating}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
      />
    </>
  )
}
