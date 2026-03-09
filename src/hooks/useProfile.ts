import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { profileService, type Profile, type UpdateProfileInput } from '@/services/profile.service'

export function useProfile() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return profileService.getProfile(user.id)
    },
    enabled: !!user?.id,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateProfileInput) => {
      if (!user?.id) throw new Error('User not authenticated')
      return profileService.updateProfile(user.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (address: {
      address_line1: string
      address_line2?: string
      city: string
      county?: string
      postcode: string
      country: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated')
      return profileService.updateAddress(user.id, address)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateAddress: updateAddressMutation.mutateAsync,
    isUpdatingAddress: updateAddressMutation.isPending,
  }
}
