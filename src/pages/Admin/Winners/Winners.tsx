import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '../components'
import { Search, Eye, Download, Trophy, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

type Winner = Database['public']['Tables']['winners']['Row']

interface WinnerWithDetails extends Winner {
  competition_title?: string
  user_email?: string
  fulfillment_status?: string | null
}

export default function Winners() {
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setCompetitions(data || [])
    } catch (error) {
      console.error('Error loading competitions:', error)
    }
  }

  // Query builder for infinite scroll
  const queryBuilder = useCallback(() => {
    let query = supabase
      .from('winners')
      .select(`
        *,
        competition:competitions(title),
        user:profiles(email)
      `)
      .order('won_at', { ascending: false })

    if (competitionFilter !== 'all') {
      query = query.eq('competition_id', competitionFilter)
    }

    return query
  }, [competitionFilter])

  // Transform function to enrich winner data
  const transformWinners = useCallback(async (rawData: unknown[]): Promise<WinnerWithDetails[]> => {
    const data = rawData as (Winner & {
      competition?: { title: string }
      user?: { email: string }
    })[]

    // Fetch prize fulfillments separately
    const ticketIds = data
      .map((winner) => winner.ticket_id)
      .filter((id): id is string => !!id)

    let fulfillments: Record<string, string | null | undefined> = {}
    if (ticketIds.length > 0) {
      const { data: fulfillmentData } = await supabase
        .from('prize_fulfillments')
        .select('ticket_id, status')
        .in('ticket_id', ticketIds)

      fulfillments =
        fulfillmentData?.reduce(
          (acc, f) => ({
            ...acc,
            [f.ticket_id]: f.status,
          }),
          {} as Record<string, string | null | undefined>
        ) || {}
    }

    // Transform data
    return data.map((winner) => ({
      ...winner,
      competition_title: winner.competition?.title,
      user_email: winner.user?.email,
      fulfillment_status: winner.ticket_id ? fulfillments[winner.ticket_id] : undefined,
    }))
  }, [])

  // Use infinite scroll hook with transformation
  const {
    data: allWinners,
    loading,
    loadingMore,
    hasMore,
    observerRef,
  } = useInfiniteScroll<Record<string, unknown>, WinnerWithDetails>({
    queryBuilder: queryBuilder as never,
    pageSize: 10,
    dependencies: [competitionFilter],
    transform: transformWinners,
  })

  // Apply status filter client-side
  const winners = useMemo(() => {
    if (statusFilter === 'fulfilled') {
      return allWinners.filter(
        (w) => w.fulfillment_status === 'completed' || w.fulfillment_status === 'delivered'
      )
    } else if (statusFilter === 'pending') {
      return allWinners.filter(
        (w) =>
          !w.fulfillment_status ||
          w.fulfillment_status === 'pending' ||
          w.fulfillment_status === 'prize_selected' ||
          w.fulfillment_status === 'cash_selected'
      )
    }
    return allWinners
  }, [allWinners, statusFilter])

  // Client-side search filter
  const filteredWinners = useMemo(
    () =>
      winners.filter((winner) => {
        const query = searchQuery.toLowerCase()
        return (
          winner.display_name.toLowerCase().includes(query) ||
          winner.prize_name.toLowerCase().includes(query) ||
          winner.user_email?.toLowerCase().includes(query) ||
          winner.competition_title?.toLowerCase().includes(query)
        )
      }),
    [winners, searchQuery]
  )

  const getFulfillmentBadge = (status?: string | null) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-admin-warning-bg text-admin-warning-fg' },
      prize_selected: { label: 'Prize Selected', color: 'bg-admin-info-bg text-admin-info-fg' },
      cash_selected: { label: 'Cash Selected', color: 'bg-admin-purple-bg text-admin-purple-fg' },
      processing: { label: 'Processing', color: 'bg-admin-orange-bg text-admin-orange-fg' },
      dispatched: { label: 'Dispatched', color: 'bg-admin-purple-bg text-admin-purple-fg' },
      delivered: { label: 'Delivered', color: 'bg-admin-success-bg text-admin-success-fg' },
      completed: { label: 'Completed', color: 'bg-admin-success-bg text-admin-success-fg' },
      expired: { label: 'Expired', color: 'bg-admin-error-bg text-admin-error-text' },
    }

    const badge = status ? badges[status] : { label: 'Not Started', color: 'bg-admin-gray-bg text-admin-gray-text' }
    return badge
  }

  const handleExport = () => {
    const csv = [
      ['Winner Name', 'Email', 'Competition', 'Prize', 'Value', 'Won Date', 'Status'].join(','),
      ...filteredWinners.map((winner) =>
        [
          winner.display_name,
          winner.user_email || 'N/A',
          winner.competition_title || 'N/A',
          winner.prize_name,
          winner.prize_value_gbp || '0',
          winner.won_at ? new Date(winner.won_at).toLocaleDateString('en-GB') : 'N/A',
          winner.fulfillment_status || 'Pending',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `winners-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Winners' }]}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Trophy className="size-6 text-admin-warning-fg" />
                Winners
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage competition winners and prize fulfillments
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredWinners.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-success-fg text-white rounded-lg hover:bg-admin-success-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-admin-warning-bg rounded-lg">
                  <Trophy className="size-6 text-admin-warning-fg" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Winners</div>
                  <div className="text-2xl font-semibold">{winners.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-admin-success-bg rounded-lg">
                  <Gift className="size-6 text-admin-success-fg" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fulfilled</div>
                  <div className="text-2xl font-semibold">
                    {
                      winners.filter(
                        (w) =>
                          w.fulfillment_status === 'completed' ||
                          w.fulfillment_status === 'delivered'
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-admin-card-bg border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-admin-orange-bg rounded-lg">
                  <Gift className="size-6 text-admin-orange-fg" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-semibold">
                    {
                      winners.filter(
                        (w) =>
                          !w.fulfillment_status ||
                          w.fulfillment_status === 'pending' ||
                          w.fulfillment_status === 'prize_selected' ||
                          w.fulfillment_status === 'cash_selected' ||
                          w.fulfillment_status === 'processing'
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
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
                    placeholder="Search by name, prize, email, or competition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg"
                  />
                </div>
              </div>

              {/* Competition Filter */}
              <div>
                <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="All Competitions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Competitions</SelectItem>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id} className="cursor-pointer">
                        {comp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                    <SelectItem value="pending" className="cursor-pointer">Pending Fulfillment</SelectItem>
                    <SelectItem value="fulfilled" className="cursor-pointer">Fulfilled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Winners Table */}
          <div className="bg-admin-card-bg border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading winners...</p>
              </div>
            ) : filteredWinners.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="size-12 text-admin-gray-bg mx-auto mb-4" />
                <p className="text-muted-foreground">No winners found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-admin-hover-bg border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Winner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Prize
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Won Date
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
                    {filteredWinners.map((winner) => {
                      const badge = getFulfillmentBadge(winner.fulfillment_status)
                      return (
                        <tr key={winner.id} className="hover:bg-admin-hover-bg cursor-pointer">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-foreground">{winner.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {winner.user_email || 'No email'}
                              </div>
                              {winner.location && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {winner.location}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {winner.competition_title || 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {winner.prize_image_url && (
                                <img
                                  src={winner.prize_image_url}
                                  alt={winner.prize_name}
                                  className="size-12 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium text-foreground">{winner.prize_name}</div>
                                {winner.win_type && (
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {winner.win_type.replace(/_/g, ' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {winner.prize_value_gbp ? `£${winner.prize_value_gbp.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {winner.won_at
                              ? new Date(winner.won_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <Link
                              to={`/admin/dashboard/winners/${winner.id}`}
                              className="inline-flex items-center gap-1 text-admin-info-fg hover:text-admin-info-text font-medium cursor-pointer"
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                  <div ref={observerRef} className="p-4 text-center">
                    {loadingMore && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="size-5 border-2 border-admin-gray-bg border-t-admin-info-fg rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Loading more winners...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results Message */}
                {!hasMore && filteredWinners.length > 0 && (
                  <div className="p-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      All winners loaded ({filteredWinners.length} total)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
