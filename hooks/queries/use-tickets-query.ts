"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// Query keys for React Query cache management
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
}

interface TicketFilters {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  search?: string
}

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  type: string
  created_at: string
  updated_at: string
  [key: string]: any
}

// Fetch tickets with filters
async function fetchTickets(filters: TicketFilters = {}): Promise<{ data: Ticket[]; total: number }> {
  const supabase = createClient()
  
  let query = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority)
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type)
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters.page && filters.limit) {
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data: data || [], total: count || 0 }
}

// Fetch single ticket
async function fetchTicket(id: string): Promise<Ticket> {
  const supabase = createClient()
  const { data, error } = await supabase.from("tickets").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

// Create ticket
async function createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
  const supabase = createClient()
  const { data, error } = await supabase.from("tickets").insert([ticket]).select().single()

  if (error) throw error
  return data
}

// Update ticket
async function updateTicket({ id, updates }: { id: string; updates: Partial<Ticket> }): Promise<Ticket> {
  const supabase = createClient()
  const { data, error } = await supabase.from("tickets").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

// Delete ticket
async function deleteTicket(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("tickets").delete().eq("id", id)

  if (error) throw error
}

// REACT QUERY HOOKS

/**
 * Hook to fetch tickets with automatic caching
 * Data is cached for 5 minutes and reused across page navigations
 */
export function useTicketsQuery(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => fetchTickets(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single ticket with automatic caching
 */
export function useTicketQuery(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicket(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a ticket with automatic cache invalidation
 */
export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      // Invalidate all ticket lists to refetch
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Hook to update a ticket with optimistic updates
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTicket,
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.detail(id) })

      // Snapshot previous value
      const previousTicket = queryClient.getQueryData(ticketKeys.detail(id))

      // Optimistically update
      queryClient.setQueryData(ticketKeys.detail(id), (old: any) => ({
        ...old,
        ...updates,
      }))

      return { previousTicket }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(id), context.previousTicket)
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Hook to delete a ticket with automatic cache invalidation
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

/**
 * Prefetch tickets for instant navigation
 */
export function usePrefetchTickets(filters: TicketFilters = {}) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: ticketKeys.list(filters),
      queryFn: () => fetchTickets(filters),
    })
  }
}
