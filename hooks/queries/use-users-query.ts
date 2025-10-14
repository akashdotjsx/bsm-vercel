"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

interface UserFilters {
  search?: string
  role?: string
  status?: string
}

// Fetch users
async function fetchUsers(filters: UserFilters = {}) {
  const supabase = createClient()
  
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  if (filters.role) {
    query = query.eq("role", filters.role)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Fetch single user
async function fetchUser(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

// REACT QUERY HOOKS

/**
 * Hook to fetch users with automatic caching
 */
export function useUsersQuery(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change frequently
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook to fetch a single user with automatic caching
 */
export function useUserQuery(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Prefetch users for instant navigation
 */
export function usePrefetchUsers(filters: UserFilters = {}) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: userKeys.list(filters),
      queryFn: () => fetchUsers(filters),
    })
  }
}
