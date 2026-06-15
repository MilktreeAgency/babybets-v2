import type { QueryClient } from '@tanstack/react-query'

export const ticketsQueryKey = (userId?: string) => ['tickets', userId] as const

export function invalidateTicketQueries(queryClient: QueryClient, userId?: string) {
  queryClient.invalidateQueries({ queryKey: ticketsQueryKey(userId) })
  queryClient.invalidateQueries({ queryKey: ['wallet-credits'] })
  queryClient.invalidateQueries({ queryKey: ['prize-fulfillments'] })
  queryClient.invalidateQueries({ queryKey: ['winners'] })
}
