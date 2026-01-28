import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { PrizeFulfillment, PrizeChoice } from '@/types'

interface UpdateFulfillmentParams {
  fulfillmentId: string
  choice?: PrizeChoice
  deliveryAddress?: Record<string, unknown>
  notes?: string
}

export function usePrizeFulfillments() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch user's prize fulfillments
  const { data: fulfillments = [], isLoading, error } = useQuery({
    queryKey: ['prize-fulfillments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('prize_fulfillments')
        .select(`
          *,
          ticket:ticket_allocations(id, ticket_number),
          competition:competitions(id, title, slug, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch prize details for each fulfillment
      const fulfillmentsWithPrizes = await Promise.all(
        (data || []).map(async (fulfillment: PrizeFulfillment) => {
          if (!fulfillment.prize_id) {
            return { ...fulfillment, prize: undefined }
          }

          // Fetch competition prize and its template
          const { data: compPrizeData } = await supabase
            .from('competition_instant_win_prizes')
            .select('id, prize_template_id')
            .eq('id', fulfillment.prize_id)
            .single()

          if (compPrizeData?.prize_template_id) {
            const { data: templateData } = await supabase
              .from('prize_templates')
              .select('*')
              .eq('id', compPrizeData.prize_template_id)
              .single()

            if (templateData) {
              return {
                ...fulfillment,
                prize: templateData
              }
            }
          }

          return { ...fulfillment, prize: undefined }
        })
      )

      return fulfillmentsWithPrizes
    },
    enabled: !!user?.id,
  })

  // Update prize fulfillment (for claiming, address, etc.)
  const updateFulfillmentMutation = useMutation({
    mutationFn: async ({ fulfillmentId, choice, deliveryAddress, notes }: UpdateFulfillmentParams) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (choice !== undefined) {
        updateData.choice = choice
        updateData.responded_at = new Date().toISOString()
        // If choosing cash, mark as pending admin action
        if (choice === 'cash') {
          updateData.status = 'pending'
        }
      }

      if (deliveryAddress !== undefined) {
        updateData.delivery_address = deliveryAddress
      }

      if (notes !== undefined) {
        updateData.notes = notes
      }

      const { data, error } = await supabase
        .from('prize_fulfillments')
        .update(updateData)
        .eq('id', fulfillmentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch fulfillments
      queryClient.invalidateQueries({ queryKey: ['prize-fulfillments'] })
    },
  })

  // Get pending fulfillments (need user action)
  const pendingFulfillments = fulfillments.filter(
    (f) => f.status === 'pending' && !f.responded_at
  )

  // Get active fulfillments (in process)
  const activeFulfillments = fulfillments.filter(
    (f) => f.status === 'processing' || f.status === 'dispatched'
  )

  // Get completed fulfillments
  const completedFulfillments = fulfillments.filter(
    (f) => f.status === 'completed' || f.status === 'delivered'
  )

  // Check if any fulfillments are expiring soon (within 7 days)
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiringSoon = fulfillments.filter(
    (f) => f.status === 'pending' &&
           !f.responded_at &&
           new Date(f.claim_deadline) <= sevenDaysFromNow
  )

  return {
    fulfillments,
    pendingFulfillments,
    activeFulfillments,
    completedFulfillments,
    expiringSoon,
    isLoading,
    error,
    updateFulfillment: updateFulfillmentMutation.mutateAsync,
    isUpdating: updateFulfillmentMutation.isPending,
  }
}
