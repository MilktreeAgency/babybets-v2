import { useState, useEffect } from 'react'
import { DashboardHeader } from '../components'
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InfluencerWithSales = {
  id: string
  display_name: string
  slug: string
  email: string
  commission_tier: number
  total_sales_pence: number
  total_commission_pence: number
  monthly_sales_pence: number
  pending_commission_pence: number
  approved_commission_pence: number
  paid_commission_pence: number
  sale_count: number
}

export default function InfluencerSales() {
  const [influencers, setInfluencers] = useState<InfluencerWithSales[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadInfluencerSales()
  }, [filter])

  const loadInfluencerSales = async () => {
    try {
      setLoading(true)

      // Get all active influencers
      const { data: influencersData, error: influencersError } = await supabase
        .from('influencers')
        .select(`
          id,
          display_name,
          slug,
          commission_tier,
          total_sales_pence,
          total_commission_pence,
          monthly_sales_pence,
          profiles!influencers_user_id_fkey (
            email
          )
        `)
        .eq('is_active', true)
        .order('total_sales_pence', { ascending: false })

      if (influencersError) throw influencersError

      // Get sales breakdown for each influencer
      const influencersWithSales = await Promise.all(
        (influencersData || []).map(async (influencer) => {
          const { data: salesData } = await supabase
            .from('influencer_sales')
            .select('status, commission_pence')
            .eq('influencer_id', influencer.id)

          const pending = salesData?.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.commission_pence || 0), 0) || 0
          const approved = salesData?.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.commission_pence || 0), 0) || 0
          const paid = salesData?.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.commission_pence || 0), 0) || 0

          return {
            id: influencer.id,
            display_name: influencer.display_name,
            slug: influencer.slug,
            email: (influencer.profiles as any)?.email || '',
            commission_tier: influencer.commission_tier || 1,
            total_sales_pence: influencer.total_sales_pence || 0,
            total_commission_pence: influencer.total_commission_pence || 0,
            monthly_sales_pence: influencer.monthly_sales_pence || 0,
            pending_commission_pence: pending,
            approved_commission_pence: approved,
            paid_commission_pence: paid,
            sale_count: salesData?.length || 0
          }
        })
      )

      // Apply filter
      let filtered = influencersWithSales
      if (filter === 'has-pending') {
        filtered = influencersWithSales.filter(i => i.pending_commission_pence > 0)
      } else if (filter === 'has-approved') {
        filtered = influencersWithSales.filter(i => i.approved_commission_pence > 0)
      } else if (filter === 'active') {
        filtered = influencersWithSales.filter(i => i.sale_count > 0)
      }

      setInfluencers(filtered)
    } catch (error) {
      console.error('Error loading influencer sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCommissionRate = (tier: number) => {
    switch (tier) {
      case 1: return '10%'
      case 2: return '15%'
      case 3: return '20%'
      case 4: return '25%'
      default: return '10%'
    }
  }

  const totalStats = {
    total: influencers.reduce((sum, i) => sum + i.total_sales_pence, 0),
    commission: influencers.reduce((sum, i) => sum + i.total_commission_pence, 0),
    pending: influencers.reduce((sum, i) => sum + i.pending_commission_pence + i.approved_commission_pence, 0),
    paid: influencers.reduce((sum, i) => sum + i.paid_commission_pence, 0),
    count: influencers.length
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Influencer Sales' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Partner Performance</h1>
              <p className="text-muted-foreground mt-1">
                Track sales and commission earnings by partner
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="size-8 text-admin-success-fg" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-admin-card-bg border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-admin-info-bg/20">
                  <TrendingUp className="size-5 text-admin-info-fg" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Total Sales</p>
              </div>
              <p className="text-3xl font-bold">£{(totalStats.total / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{totalStats.count} partners</p>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-admin-success-bg/20">
                  <DollarSign className="size-5 text-admin-success-fg" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Total Commission</p>
              </div>
              <p className="text-3xl font-bold text-admin-success-fg">£{(totalStats.commission / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-admin-warning-bg/20">
                  <Clock className="size-5 text-admin-warning-fg" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Awaiting Payout</p>
              </div>
              <p className="text-3xl font-bold text-admin-warning-fg">£{(totalStats.pending / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending & approved</p>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-admin-success-bg/20">
                  <CheckCircle className="size-5 text-admin-success-fg" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Paid Out</p>
              </div>
              <p className="text-3xl font-bold">£{(totalStats.paid / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-admin-card-bg border border-border rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <label className="text-sm font-semibold text-muted-foreground">Filter:</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    <SelectItem value="active">With Sales</SelectItem>
                    <SelectItem value="has-pending">Has Pending</SelectItem>
                    <SelectItem value="has-approved">Has Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-semibold">
                  {influencers.length} {influencers.length === 1 ? 'partner' : 'partners'}
                </span>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block size-12 border-4 border-border border-t-admin-info-fg rounded-full animate-spin"></div>
            </div>
          ) : influencers.length === 0 ? (
            <div className="bg-admin-card-bg border border-border rounded-lg p-12 text-center">
              <DollarSign className="size-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No partners found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No active partners yet.' : `No partners match this filter.`}
              </p>
            </div>
          ) : (
            <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Partner</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Total Sales</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Monthly Sales</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Tier</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Total Earned</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Pending</th>
                      <th className="text-left py-4 px-6 font-bold text-xs text-muted-foreground uppercase tracking-wider">Paid Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {influencers.map((influencer) => (
                      <tr key={influencer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm mb-1">{influencer.display_name}</div>
                          <div className="text-xs text-muted-foreground">/{influencer.slug}</div>
                          <a
                            href={`mailto:${influencer.email}`}
                            className="text-xs text-admin-info-fg hover:underline cursor-pointer mt-1 inline-block"
                          >
                            {influencer.email}
                          </a>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-admin-info-fg">
                            £{(influencer.total_sales_pence / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {influencer.sale_count} {influencer.sale_count === 1 ? 'order' : 'orders'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm">
                            £{(influencer.monthly_sales_pence / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">This month</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-admin-info-bg/20 text-admin-info-fg text-xs font-bold mb-1">
                            Tier {influencer.commission_tier}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getCommissionRate(influencer.commission_tier)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-admin-success-fg">
                            £{(influencer.total_commission_pence / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">All time</div>
                        </td>
                        <td className="py-4 px-6">
                          {influencer.pending_commission_pence > 0 || influencer.approved_commission_pence > 0 ? (
                            <>
                              <div className="font-bold text-sm text-admin-warning-fg">
                                £{((influencer.pending_commission_pence + influencer.approved_commission_pence) / 100).toFixed(2)}
                              </div>
                              {influencer.pending_commission_pence > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  £{(influencer.pending_commission_pence / 100).toFixed(2)} pending
                                </div>
                              )}
                              {influencer.approved_commission_pence > 0 && (
                                <div className="text-xs text-admin-info-fg mt-1">
                                  £{(influencer.approved_commission_pence / 100).toFixed(2)} approved
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">-</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm">
                            £{(influencer.paid_commission_pence / 100).toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
