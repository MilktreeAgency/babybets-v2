import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { TicketWithDetails, TicketRevealResult } from '@/types'

async function revealTicketInternal(
  ticketId: string,
  userId: string
): Promise<TicketRevealResult> {
  const { data, error } = await supabase
    .from('ticket_allocations')
    .update({
      is_revealed: true,
      revealed_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .eq('sold_to_user_id', userId)
    .select('id, prize_id')
    .single()

  if (error) throw error

  let prizeData = undefined
  let allocationResult: TicketRevealResult['allocationResult'] = undefined

  if (data.prize_id) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'allocate_instant_win_prize' as any,
      {
        p_ticket_id: ticketId,
        p_user_id: userId,
      }
    ) as { data: any; error: any }

    if (rpcError) {
      console.error('Error allocating prize:', rpcError)
    } else if (rpcData) {
      allocationResult = {
        success: rpcData.success,
        fulfillment_id: rpcData.fulfillment_id,
        wallet_credit_id: rpcData.wallet_credit_id,
        winner_id: rpcData.winner_id,
        message: rpcData.message,
        prize: rpcData.prize,
      }
      prizeData = rpcData.prize
    }

    if (!prizeData) {
      const { data: compPrizeData } = await (supabase as any)
        .from('competition_instant_win_prizes')
        .select('prize_template_id')
        .eq('id', data.prize_id)
        .single()

      if (compPrizeData?.prize_template_id) {
        const { data: templateData } = await (supabase as any)
          .from('prize_templates')
          .select('*')
          .eq('id', compPrizeData.prize_template_id)
          .single()

        prizeData = templateData
      }
    }
  }

  return {
    ticketId: data.id,
    hasPrize: !!data.prize_id,
    prize: prizeData,
    allocationResult,
  }
}

function invalidateTicketQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined
) {
  queryClient.invalidateQueries({ queryKey: ['tickets', userId] })
  queryClient.invalidateQueries({ queryKey: ['wallet-credits'] })
  queryClient.invalidateQueries({ queryKey: ['prize-fulfillments'] })
  queryClient.invalidateQueries({ queryKey: ['winners'] })
}

export function useTickets() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const ticketsQueryKey = ['tickets', user?.id] as const

  // Fetch user's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ticketsQueryKey,
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('ticket_allocations')
        .select(`
          *,
          competition:competitions!inner(id, title, slug, image_url, images, competition_type)
        `)
        .eq('sold_to_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to ensure competition is not an array
      const transformedData = (data || []).map((ticket: any) => ({
        ...ticket,
        competition: Array.isArray(ticket.competition) ? ticket.competition[0] : ticket.competition
      }))

      // Check for end prize winners (main draw winners)
      const ticketIds = transformedData.map((t: any) => t.id)
      let endPrizeWinners: Record<string, any> = {}

      if (ticketIds.length > 0) {
        const { data: winnersData } = await supabase
          .from('winners')
          .select('ticket_id, prize_name, prize_value_gbp')
          .in('ticket_id', ticketIds)
          .eq('win_type', 'end_prize')

        if (winnersData) {
          endPrizeWinners = winnersData.reduce((acc: any, winner: any) => ({
            ...acc,
            [winner.ticket_id]: {
              name: winner.prize_name,
              value_gbp: winner.prize_value_gbp,
              type: 'physical',
            }
          }), {})
        }
      }

      // Manually fetch prize details for tickets with prizes
      const ticketsWithPrizes = await Promise.all(
        transformedData.map(async (ticket: any) => {
          // Check if this ticket is an end prize winner first
          if (endPrizeWinners[ticket.id]) {
            return {
              ...ticket,
              prize_id: 'end_prize', // Mark as having a prize
              prize: endPrizeWinners[ticket.id],
              is_end_prize_winner: true
            }
          }

          // Check for instant win prizes
          if (!ticket.prize_id) {
            return { ...ticket, prize: undefined }
          }

          // Fetch competition prize and its template
          const { data: compPrizeData } = await (supabase as any)
            .from('competition_instant_win_prizes')
            .select('id, prize_template_id')
            .eq('id', ticket.prize_id)
            .single()

          if (compPrizeData && (compPrizeData as any).prize_template_id) {
            const { data: templateData } = await (supabase as any)
              .from('prize_templates')
              .select('id, name, short_name, type, value_gbp, cash_alternative_gbp, image_url')
              .eq('id', (compPrizeData as any).prize_template_id)
              .single()

            if (templateData) {
              return {
                ...ticket,
                prize: templateData
              }
            }
          }

          return { ...ticket, prize: undefined }
        })
      )

      return ticketsWithPrizes as TicketWithDetails[]
    },
    enabled: !!user?.id,
  })

  // Reveal a ticket (scratch card action)
  const revealTicketMutation = useMutation({
    mutationFn: async (ticketId: string): Promise<TicketRevealResult> => {
      if (!user?.id) throw new Error('User not authenticated')
      return revealTicketInternal(ticketId, user.id)
    },
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ticketsQueryKey })
      const previous = queryClient.getQueryData<TicketWithDetails[]>(ticketsQueryKey)
      queryClient.setQueryData<TicketWithDetails[]>(ticketsQueryKey, (old) =>
        (old ?? []).map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, is_revealed: true, revealed_at: new Date().toISOString() }
            : ticket
        )
      )
      return { previous }
    },
    onError: (_error, _ticketId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ticketsQueryKey, context.previous)
      }
    },
    onSuccess: () => {
      // Defer side-effect refetches so reveal animations stay smooth
      window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet-credits'] })
        queryClient.invalidateQueries({ queryKey: ['prize-fulfillments'] })
        queryClient.invalidateQueries({ queryKey: ['winners'] })
      }, 1500)
    },
  })

  const revealAllTicketsMutation = useMutation({
    mutationFn: async (): Promise<{ revealed_count: number; prizes_allocated: number }> => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('reveal_all_instant_win_tickets', {
        p_user_id: user.id,
      })

      if (error) throw error

      const result = data as { revealed_count?: number; prizes_allocated?: number } | null
      return {
        revealed_count: result?.revealed_count ?? 0,
        prizes_allocated: result?.prizes_allocated ?? 0,
      }
    },
    onSuccess: async () => {
      invalidateTicketQueries(queryClient, user?.id)
      await queryClient.refetchQueries({ queryKey: ticketsQueryKey })
    },
  })

  // Get unrevealed tickets count (instant win only)
  const unrevealedCount = tickets.filter((t) => !t.is_revealed && t.competition?.competition_type === 'instant_win').length

  // Get tickets with prizes
  const winningTickets = tickets.filter((t) => t.is_revealed && t.prize_id)

  return {
    tickets,
    isLoading,
    error,
    unrevealedCount,
    winningTickets,
    revealTicket: revealTicketMutation.mutateAsync,
    revealAllTickets: revealAllTicketsMutation.mutateAsync,
    refreshTickets: () => queryClient.refetchQueries({ queryKey: ticketsQueryKey }),
    isRevealing: revealTicketMutation.isPending || revealAllTicketsMutation.isPending,
  }
}
