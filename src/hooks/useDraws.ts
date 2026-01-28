import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Draw, DrawExecutionResult, DrawVerificationResult } from '@/types'

export function useDraws() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch all draws
  const { data: draws = [], isLoading, error } = useQuery({
    queryKey: ['draws'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('executed_at', { ascending: false })

      if (error) throw error
      return (data || []) as Draw[]
    },
    enabled: !!user && user.isAdmin,
  })

  // Fetch draw by competition ID
  const getDrawByCompetitionId = async (competitionId: string): Promise<Draw | null> => {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('competition_id', competitionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as Draw
  }

  // Execute a competition draw
  const executeDrawMutation = useMutation({
    mutationFn: async (competitionId: string): Promise<DrawExecutionResult> => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!user.isAdmin) throw new Error('Unauthorized: Admin access required')

      const { data, error } = await supabase.rpc(
        'execute_competition_draw',
        {
          p_competition_id: competitionId,
          p_admin_id: user.id,
        }
      )

      if (error) throw error
      return data as DrawExecutionResult
    },
    onSuccess: () => {
      // Invalidate and refetch draws and competitions
      queryClient.invalidateQueries({ queryKey: ['draws'] })
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      queryClient.invalidateQueries({ queryKey: ['winners'] })
    },
  })

  // Verify draw integrity
  const verifyDrawMutation = useMutation({
    mutationFn: async (drawId: string): Promise<DrawVerificationResult> => {
      const { data, error } = await supabase.rpc(
        'verify_draw_integrity',
        {
          p_draw_id: drawId,
        }
      )

      if (error) throw error
      return data as DrawVerificationResult
    },
  })

  return {
    draws,
    isLoading,
    error,
    getDrawByCompetitionId,
    executeDraw: executeDrawMutation.mutateAsync,
    isExecutingDraw: executeDrawMutation.isPending,
    verifyDraw: verifyDrawMutation.mutateAsync,
    isVerifyingDraw: verifyDrawMutation.isPending,
  }
}
