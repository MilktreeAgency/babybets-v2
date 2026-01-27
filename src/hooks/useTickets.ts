import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { TicketWithDetails, TicketRevealResult } from '@/types'

export function useTickets() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch user's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('ticket_allocations')
        .select(`
          *,
          competition:competitions(id, title, slug, image_url, competition_type)
        `)
        .eq('sold_to_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Manually fetch prize details for tickets with prizes
      const ticketsWithPrizes = await Promise.all(
        (data || []).map(async (ticket: any) => {
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
      const { data, error } = await supabase
        .from('ticket_allocations')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select('id, prize_id')
        .single()

      if (error) throw error

      let prizeData = undefined

      if (data.prize_id) {
        // Fetch the prize details
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

      return {
        ticketId: data.id,
        hasPrize: !!data.prize_id,
        prize: prizeData,
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  // Get unrevealed tickets count
  const unrevealedCount = tickets.filter((t) => !t.is_revealed).length

  // Get tickets with prizes
  const winningTickets = tickets.filter((t) => t.is_revealed && t.prize_id)

  return {
    tickets,
    isLoading,
    error,
    unrevealedCount,
    winningTickets,
    revealTicket: revealTicketMutation.mutateAsync,
    isRevealing: revealTicketMutation.isPending,
  }
}
