import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { WalletCreditWithDetails, WalletSummary, WalletTransaction } from '@/types'

export function useWallet() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch wallet credits
  const { data: credits = [], isLoading: isLoadingCredits } = useQuery({
    queryKey: ['wallet-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('wallet_credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('remaining_pence', 0)
        .order('expires_at', { ascending: true })

      if (error) throw error

      // Add expiry soon flag (within 7 days)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      return data.map((credit) => ({
        ...credit,
        isExpiringSoon: new Date(credit.expires_at) <= sevenDaysFromNow,
      })) as WalletCreditWithDetails[]
    },
    enabled: !!user?.id,
  })

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as WalletTransaction[]
    },
    enabled: !!user?.id,
  })

  // Calculate wallet summary
  const summary: WalletSummary = {
    totalBalance: credits.reduce((sum, c) => sum + c.remaining_pence, 0),
    availableBalance: credits.reduce((sum, c) => sum + c.remaining_pence, 0),
    expiringBalance: credits
      .filter((c) => c.isExpiringSoon)
      .reduce((sum, c) => sum + c.remaining_pence, 0),
    nextExpiryDate: credits.length > 0 ? credits[0].expires_at : null,
  }

  // Apply credit to order (deduct from wallet)
  const applyCreditMutation = useMutation({
    mutationFn: async ({ orderId, amountPence }: { orderId: string; amountPence: number }) => {
      // This would be handled by a Supabase function/trigger
      // For now, just a placeholder
      const { data, error } = await supabase.from('orders').update({
        credit_applied_pence: amountPence,
      }).eq('id', orderId)

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-credits'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
    },
  })

  return {
    credits,
    transactions,
    summary,
    isLoading: isLoadingCredits || isLoadingTransactions,
    applyCredit: applyCreditMutation.mutateAsync,
    isApplying: applyCreditMutation.isPending,
  }
}
