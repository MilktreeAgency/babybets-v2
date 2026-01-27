import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SidebarCounts {
  fulfillments: number
  withdrawals: number
}

export function useSidebarCounts() {
  const [counts, setCounts] = useState<SidebarCounts>({
    fulfillments: 0,
    withdrawals: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCounts()

    // Set up real-time subscription for fulfillments
    const fulfillmentsChannel = supabase
      .channel('fulfillments-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prize_fulfillments',
        },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    // Set up real-time subscription for withdrawals
    const withdrawalsChannel = supabase
      .channel('withdrawals-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
        },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    return () => {
      fulfillmentsChannel.unsubscribe()
      withdrawalsChannel.unsubscribe()
    }
  }, [])

  const loadCounts = async () => {
    try {
      // Get pending fulfillments count (pending, prize_selected, cash_selected)
      const { count: fulfillmentsCount, error: fulfillmentsError } = await supabase
        .from('prize_fulfillments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'prize_selected', 'cash_selected'])

      if (fulfillmentsError) throw fulfillmentsError

      // Get pending withdrawals count (pending and approved status)
      const { count: withdrawalsCount, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'approved'])

      if (withdrawalsError) throw withdrawalsError

      setCounts({
        fulfillments: fulfillmentsCount || 0,
        withdrawals: withdrawalsCount || 0,
      })
    } catch (error) {
      console.error('Error loading sidebar counts:', error)
    } finally {
      setLoading(false)
    }
  }

  return { counts, loading }
}
