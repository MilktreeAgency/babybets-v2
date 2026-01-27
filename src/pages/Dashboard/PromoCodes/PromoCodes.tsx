import { useState, useEffect } from 'react'
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

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeType = Database['public']['Enums']['promo_code_type']

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadPromoCodes()
  }, [statusFilter, typeFilter])

  const loadPromoCodes = async () => {
    try {
      setLoading(true)
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
        query = query.eq('type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setPromoCodes(data || [])
    } catch (error) {
      console.error('Error loading promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPromoCodes = promoCodes.filter((promo) =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase())
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
      loadPromoCodes()
    } catch (error) {
      console.error('Error toggling promo code:', error)
      alert('Failed to update promo code status')
    }
  }

  const getTypeBadge = (type: PromoCodeType) => {
    const badges = {
      percentage: { label: 'Percentage Off', color: 'bg-blue-100 text-blue-800' },
      fixed_value: { label: 'Fixed Amount', color: 'bg-green-100 text-green-800' },
      free_tickets: { label: 'Free Tickets', color: 'bg-purple-100 text-purple-800' },
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
      return <span className="text-xs text-gray-500">Inactive</span>
    }
    if (isMaxedOut(promoCode)) {
      return <span className="text-xs text-red-600">Max Uses Reached</span>
    }
    if (isExpired(promoCode)) {
      return <span className="text-xs text-red-600">Expired</span>
    }
    return <span className="text-xs text-green-600">Active</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" />
              Create Promo Code
            </button>
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
                    placeholder="Search promo codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading promo codes...</p>
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No promo codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPromoCodes.map((promoCode) => {
                      const typeBadge = getTypeBadge(promoCode.type)
                      return (
                        <tr key={promoCode.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-mono font-semibold text-blue-600">
                              {promoCode.code}
                            </div>
                            {promoCode.new_customers_only && (
                              <div className="text-xs text-purple-600 mt-1">New customers only</div>
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
                              <div className="mt-1 w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
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
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(promoCode)}
                                className={
                                  promoCode.is_active
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'text-gray-400 hover:text-gray-600'
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
          </div>
        </div>
      </div>

      <PromoCodeDialog
        promoCode={selectedPromoCode}
        open={dialogOpen}
        isCreating={isCreating}
        onOpenChange={setDialogOpen}
        onSuccess={loadPromoCodes}
      />
    </>
  )
}
