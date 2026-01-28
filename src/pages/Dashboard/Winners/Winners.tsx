import { useState, useEffect } from 'react'
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

type Winner = Database['public']['Tables']['winners']['Row']

interface WinnerWithDetails extends Winner {
  competition_title?: string
  user_email?: string
  fulfillment_status?: string
}

export default function Winners() {
  const [winners, setWinners] = useState<WinnerWithDetails[]>([])
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadCompetitions()
    loadWinners()
  }, [competitionFilter, statusFilter])

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

  const loadWinners = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('winners')
        .select(`
          *,
          competition:competitions(title),
          user:profiles(email),
          fulfillment:prize_fulfillments(status)
        `)
        .order('won_at', { ascending: false })

      if (competitionFilter !== 'all') {
        query = query.eq('competition_id', competitionFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data
      const transformedData = (data || []).map((winner) => ({
        ...winner,
        competition_title: winner.competition?.title,
        user_email: winner.user?.email,
        fulfillment_status: winner.fulfillment?.status,
      }))

      // Apply status filter
      let filteredData = transformedData
      if (statusFilter === 'fulfilled') {
        filteredData = transformedData.filter(
          (w) => w.fulfillment_status === 'completed' || w.fulfillment_status === 'delivered'
        )
      } else if (statusFilter === 'pending') {
        filteredData = transformedData.filter(
          (w) =>
            !w.fulfillment_status ||
            w.fulfillment_status === 'pending' ||
            w.fulfillment_status === 'prize_selected' ||
            w.fulfillment_status === 'cash_selected'
        )
      }

      setWinners(filteredData)
    } catch (error) {
      console.error('Error loading winners:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWinners = winners.filter((winner) => {
    const query = searchQuery.toLowerCase()
    return (
      winner.display_name.toLowerCase().includes(query) ||
      winner.prize_name.toLowerCase().includes(query) ||
      winner.user_email?.toLowerCase().includes(query) ||
      winner.competition_title?.toLowerCase().includes(query)
    )
  })

  const getFulfillmentBadge = (status?: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      prize_selected: { label: 'Prize Selected', color: 'bg-blue-100 text-blue-800' },
      cash_selected: { label: 'Cash Selected', color: 'bg-purple-100 text-purple-800' },
      processing: { label: 'Processing', color: 'bg-orange-100 text-orange-800' },
      dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expired', color: 'bg-red-100 text-red-800' },
    }

    const badge = status ? badges[status] : { label: 'Not Started', color: 'bg-gray-100 text-gray-800' }
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
                <Trophy className="size-6 text-yellow-500" />
                Winners
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage competition winners and prize fulfillments
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={filteredWinners.length === 0}
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
                  <Trophy className="size-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Winners</div>
                  <div className="text-2xl font-semibold">{winners.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Gift className="size-6 text-green-600" />
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
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Gift className="size-6 text-orange-600" />
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

              {/* Competition Filter */}
              <div>
                <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Competitions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Competitions</SelectItem>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Fulfillment</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Winners Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block size-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Loading winners...</p>
              </div>
            ) : filteredWinners.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No winners found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prize
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Won Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWinners.map((winner) => {
                      const badge = getFulfillmentBadge(winner.fulfillment_status)
                      return (
                        <tr key={winner.id} className="hover:bg-gray-50">
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
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
