/**
 * Prefetch navigation pages on hover for instant loads
 * Industry standard practice - prefetch data BEFORE user clicks
 */

import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/contexts/auth-context'
import { ticketKeys } from '@/hooks/queries/use-tickets-graphql-query'

export function usePrefetchNav() {
  const queryClient = useQueryClient()
  const { organization } = useAuth()
  const organizationId = organization?.id
  
  const prefetchByHref = async (href: string) => {
    if (!organizationId) return
    
    // React Query will skip prefetch if data already exists and is fresh (within staleTime)
    // This prevents duplicate fetches!
    
    if (href.includes('/tickets')) {
      const { fetchTicketsGraphQL } = await import('@/hooks/queries/use-tickets-graphql-query')
      
      // Match the default query params from tickets page ("all tickets" view)
      const defaultParams = {
        page: 1,
        organization_id: organizationId,
      }
      
      await queryClient.prefetchQuery({
        queryKey: ticketKeys.list(defaultParams),
        queryFn: () => fetchTicketsGraphQL(defaultParams),
        staleTime: 5 * 60 * 1000,
      })
    }
    // Add more routes as needed
  }
  
  return { prefetchByHref }
}
