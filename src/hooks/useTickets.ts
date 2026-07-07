import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { invalidateTicketQueries, ticketsQueryKey } from '@/lib/ticketQueries'
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

function unwrapRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

async function fetchUserTickets(userId: string): Promise<TicketWithDetails[]> {
  const { data, error } = await supabase
    .from('ticket_allocations')
    .select(`
      *,
      competition:competitions!inner(id, title, slug, image_url, images, competition_type),
      competition_instant_win_prizes(
        id,
        prize_templates(id, name, short_name, type, value_gbp, cash_alternative_gbp, image_url)
      )
    `)
    .eq('sold_to_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const { data: endPrizeWinners } = await supabase
    .from('winners')
    .select('ticket_id, prize_name, prize_value_gbp')
    .eq('user_id', userId)
    .eq('win_type', 'end_prize')

  const endPrizeByTicketId = (endPrizeWinners ?? []).reduce<Record<string, { name: string; value_gbp: number | null; type: string }>>(
    (acc, winner) => {
      if (winner.ticket_id) {
        acc[winner.ticket_id] = {
          name: winner.prize_name,
          value_gbp: winner.prize_value_gbp,
          type: 'physical',
        }
      }
      return acc
    },
    {}
  )

  return (data ?? []).map((ticket: any) => {
    const competition = unwrapRelation(ticket.competition)
    const instantWinPrize = unwrapRelation(ticket.competition_instant_win_prizes)
    const prizeTemplate = unwrapRelation(instantWinPrize?.prize_templates)
    const endPrize = endPrizeByTicketId[ticket.id]

    const { competition_instant_win_prizes: _ciwp, ...ticketFields } = ticket

    if (endPrize) {
      return {
        ...ticketFields,
        competition,
        prize_id: 'end_prize',
        prize: endPrize,
        is_end_prize_winner: true,
      } as TicketWithDetails
    }

    return {
      ...ticketFields,
      competition,
      prize: prizeTemplate ?? undefined,
    } as TicketWithDetails
  })
}

export function useTickets() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ticketsQueryKey(user?.id)

  const { data: tickets = [], isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchUserTickets(user!.id),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const refreshTickets = useCallback(async () => {
    invalidateTicketQueries(queryClient, user?.id)
    await queryClient.refetchQueries({ queryKey: ticketsQueryKey(user?.id) })
  }, [queryClient, user?.id])

  const revealTicketMutation = useMutation({
    mutationFn: async (ticketId: string): Promise<TicketRevealResult> => {
      if (!user?.id) throw new Error('User not authenticated')
      return revealTicketInternal(ticketId, user.id)
    },
  })

  const revealAllTicketsMutation = useMutation({
    mutationFn: async (
      competitionId?: string
    ): Promise<{ revealed_count: number; prizes_allocated: number }> => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('reveal_all_instant_win_tickets', {
        p_user_id: user.id,
        ...(competitionId ? { p_competition_id: competitionId } : {}),
      })

      if (error) throw error

      const result = data as { revealed_count?: number; prizes_allocated?: number } | null
      return {
        revealed_count: result?.revealed_count ?? 0,
        prizes_allocated: result?.prizes_allocated ?? 0,
      }
    },
    onSuccess: async () => {
      await refreshTickets()
    },
  })

  const unrevealedCount = tickets.filter(
    (t) => !t.is_revealed && t.competition?.competition_type === 'instant_win'
  ).length

  const winningTickets = tickets.filter((t) => t.is_revealed && t.prize_id)

  return {
    tickets,
    isLoading,
    isFetching,
    error,
    unrevealedCount,
    winningTickets,
    revealTicket: revealTicketMutation.mutateAsync,
    revealAllTickets: revealAllTicketsMutation.mutateAsync,
    refreshTickets,
    isRevealing: revealTicketMutation.isPending || revealAllTicketsMutation.isPending,
  }
}
