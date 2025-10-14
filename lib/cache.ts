/**
 * Caching Utilities for Next.js 15+
 * Provides reusable caching functions with proper revalidation
 */

import { unstable_cache } from 'next/cache'

/**
 * Cache configuration presets
 */
export const CACHE_CONFIG = {
  // Short-lived cache for frequently changing data (1 minute)
  SHORT: {
    revalidate: 60, // 1 minute
    tags: ['short-cache'],
  },
  // Medium cache for moderately changing data (5 minutes)
  MEDIUM: {
    revalidate: 300, // 5 minutes
    tags: ['medium-cache'],
  },
  // Long cache for rarely changing data (1 hour)
  LONG: {
    revalidate: 3600, // 1 hour
    tags: ['long-cache'],
  },
  // Static cache for data that rarely changes (1 day)
  STATIC: {
    revalidate: 86400, // 24 hours
    tags: ['static-cache'],
  },
} as const

/**
 * Cache tags for different data types
 * Use these to invalidate specific data
 */
export const CACHE_TAGS = {
  tickets: 'tickets',
  ticket: (id: string) => `ticket-${id}`,
  users: 'users',
  user: (id: string) => `user-${id}`,
  services: 'services',
  service: (id: string) => `service-${id}`,
  serviceRequests: 'service-requests',
  serviceRequest: (id: string) => `service-request-${id}`,
  assets: 'assets',
  asset: (id: string) => `asset-${id}`,
  dashboard: 'dashboard',
  analytics: 'analytics',
  notifications: 'notifications',
  teams: 'teams',
  accounts: 'accounts',
  knowledgeBase: 'knowledge-base',
  article: (id: string) => `article-${id}`,
} as const

/**
 * Cached fetch wrapper with automatic retry and error handling
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { revalidate?: number; tags?: string[] }
): Promise<T> {
  const { revalidate = 60, tags = [], ...fetchOptions } = options || {}

  const response = await fetch(url, {
    ...fetchOptions,
    next: {
      revalidate,
      tags,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a cached query function
 * Usage: const getCachedTickets = createCachedQuery(getTickets, { revalidate: 60, tags: ['tickets'] })
 */
export function createCachedQuery<T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  options: {
    revalidate?: number
    tags?: string[]
    keyPrefix?: string
  } = {}
): T {
  const { revalidate = 300, tags = [], keyPrefix = 'query' } = options

  return unstable_cache(
    queryFn,
    [keyPrefix, queryFn.name],
    {
      revalidate,
      tags,
    }
  ) as T
}

/**
 * Supabase query cache wrapper
 */
export function cacheSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    revalidate?: number
    tags?: string[]
    key: string
  }
): Promise<T> {
  const { revalidate = 300, tags = [], key } = options

  const cachedQuery = unstable_cache(
    queryFn,
    [`supabase-${key}`],
    {
      revalidate,
      tags,
    }
  )

  return cachedQuery()
}

/**
 * GraphQL query cache wrapper
 */
export function cacheGraphQLQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    revalidate?: number
    tags?: string[]
    key: string
  }
): Promise<T> {
  const { revalidate = 300, tags = [], key } = options

  const cachedQuery = unstable_cache(
    queryFn,
    [`graphql-${key}`],
    {
      revalidate,
      tags,
    }
  )

  return cachedQuery()
}

/**
 * Cache invalidation helper
 * Use this in API routes or server actions
 */
export async function invalidateCache(tags: string | string[]) {
  const { revalidateTag } = await import('next/cache')
  const tagArray = Array.isArray(tags) ? tags : [tags]
  
  tagArray.forEach((tag) => {
    revalidateTag(tag)
  })
}

/**
 * Cache all data for a specific path
 */
export async function invalidatePath(path: string, type: 'page' | 'layout' = 'page') {
  const { revalidatePath } = await import('next/cache')
  revalidatePath(path, type)
}

/**
 * Preload data into cache (useful for prefetching)
 */
export async function preloadCache<T>(
  queryFn: () => Promise<T>,
  key: string,
  options: {
    revalidate?: number
    tags?: string[]
  } = {}
): Promise<void> {
  const { revalidate = 300, tags = [] } = options

  const cachedQuery = unstable_cache(
    queryFn,
    [key],
    { revalidate, tags }
  )

  // Execute to populate cache
  await cachedQuery()
}

/**
 * Time-based cache helper
 * Automatically determines cache duration based on data type
 */
export function getRevalidationTime(dataType: 'realtime' | 'frequent' | 'moderate' | 'static'): number {
  switch (dataType) {
    case 'realtime':
      return 30 // 30 seconds
    case 'frequent':
      return 60 // 1 minute
    case 'moderate':
      return 300 // 5 minutes
    case 'static':
      return 3600 // 1 hour
    default:
      return 300 // Default 5 minutes
  }
}
