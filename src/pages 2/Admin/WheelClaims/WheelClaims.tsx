import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardHeader } from '../components/DashboardHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Search, Mail, Gift, Trophy } from 'lucide-react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Database } from '@/types/database.types'

type WheelClaimRow = Database['public']['Tables']['wheel_claims']['Row']

type WheelClaim = WheelClaimRow

const PRIZE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'discount', label: 'Discount' },
  { value: 'credit', label: 'Credit' },
  { value: 'free_entry', label: 'Free Entry' },
]

const getPrizeTypeBadge = (type: string) => {
  const badges = {
    discount: { label: 'Discount', color: 'bg-admin-info-bg text-admin-info-fg', icon: Gift },
    credit: { label: 'Credit', color: 'bg-admin-success-bg text-admin-success-fg', icon: Trophy },
    free_entry: { label: 'Free Entry', color: 'bg-admin-purple-bg text-admin-purple-fg', icon: Gift },
  }
  return badges[type as keyof typeof badges] || { label: type, color: 'bg-admin-gray-bg text-admin-gray-text', icon: Gift }
}

export default function WheelClaims() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return supabase
      .from('wheel_claims')
      .select('*')
      .order('claimed_at', { ascending: false }) as any
  }, [])

  // Use infinite scroll hook
  const {
    data: claims,
    loading,
    loadingMore,
    hasMore,
    refresh,
    observerRef,
  } = useInfiniteScroll<WheelClaimRow, WheelClaim>({
    queryBuilder,
    pageSize: 20,
    dependencies: [],
  })

  // Client-side filtering
  const filteredClaims = useMemo(() => {
    let filtered = [...claims]

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(claim => claim.prize_type === typeFilter)
    }

    // Filter by search query (email or prize label)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(claim =>
        claim.email.toLowerCase().includes(query) ||
        claim.prize_label.toLowerCase().includes(query)
      )
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(claim => {
        const claimDate = new Date(claim.claimed_at)
        switch (dateFilter) {
          case 'today':
            return claimDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return claimDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return claimDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered
  }, [claims, typeFilter, searchQuery, dateFilter])

  const handleExport = () => {
    const csv = [
      ['Email', 'Prize Type', 'Prize Label', 'Amount', 'Promo Code', 'Claimed At', 'Email Sent'].join(','),
      ...filteredClaims.map(claim =>
        [
          claim.email,
          claim.prize_type,
          claim.prize_label,
          claim.prize_amount || '',
          claim.prize_type === 'discount' ? claim.prize_value : '',
          new Date(claim.claimed_at).toLocaleString(),
          claim.email_sent ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wheel-claims-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    return {
      total: filteredClaims.length,
      discounts: filteredClaims.filter(c => c.prize_type === 'discount').length,
      credits: filteredClaims.filter(c => c.prize_type === 'credit').length,
      freeEntries: filteredClaims.filter(c => c.prize_type === 'free_entry').length,
      emailsSent: filteredClaims.filter(c => c.email_sent).length,
    }
  }, [filteredClaims])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Wheel Claims' },
        ]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Wheel Prize Claims</h1>
              <p className="text-muted-foreground mt-1">
                View and manage spin the wheel prize claims
              </p>
            </div>
          </div>

          {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Claims</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Discounts</div>
            <div className="text-2xl font-bold text-admin-info-text">{stats.discounts}</div>
          </div>
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Credits</div>
            <div className="text-2xl font-bold text-admin-success-text">{stats.credits}</div>
          </div>
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Free Entries</div>
            <div className="text-2xl font-bold text-admin-purple-fg">{stats.freeEntries}</div>
          </div>
          <div className="bg-admin-card-bg border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Emails Sent</div>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-admin-card-bg border border-border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or prize..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 cursor-text"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Prize Type" />
              </SelectTrigger>
              <SelectContent>
                {PRIZE_TYPES.map(type => (
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

            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Prize</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Promo Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Claimed At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading claims...
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No claims found
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => {
                    const badge = getPrizeTypeBadge(claim.prize_type)
                    const Icon = badge.icon
                    return (
                      <tr key={claim.id} className="hover:bg-admin-hover-bg">
                        <td className="px-4 py-3 text-sm">{claim.email}</td>
                        <td className="px-4 py-3 text-sm font-medium">{claim.prize_label}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {claim.prize_amount ? (
                            claim.prize_type === 'credit' ? `£${claim.prize_amount.toFixed(2)}` : `${claim.prize_amount}%`
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {claim.prize_type === 'discount' ? claim.prize_value : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(claim.claimed_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {claim.email_sent ? (
                            <span className="inline-flex items-center gap-1 text-xs text-admin-success-text">
                              <Mail className="h-3 w-3" />
                              Sent
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not sent</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={observerRef} className="py-4 text-center">
              {loadingMore ? (
                <div className="text-sm text-muted-foreground">Loading more claims...</div>
              ) : (
                <div className="text-sm text-muted-foreground">Scroll for more</div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
