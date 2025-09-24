import { createClient as createBrowserClient } from "../supabase/client"
import { apiCache } from "./cache"

const getSupabaseClient = () => {
  return createBrowserClient()
}

interface ApiOptions {
  cache?: boolean
  cacheTTL?: number
  cacheKey?: string
  tags?: string[]
}

export class ApiClient {
  private static instance: ApiClient

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  async get<T>(
    table: string,
    options: ApiOptions & {
      select?: string
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
      tags?: string[]
    } = {},
  ): Promise<T> {
    const { cache = true, cacheTTL, cacheKey, select = "*", filters, orderBy, tags } = options

    // Generate cache key with better hashing
    const key = cacheKey || `${table}_${this.hashOptions({ select, filters, orderBy })}`

    // Check cache first
    if (cache) {
      const cached = apiCache.get<T>(key)
      if (cached) return cached
    }

    const supabase = getSupabaseClient()

    // Build query
    let query = supabase.from(table).select(select)

    if (table === "profiles") {
      // For profiles, use a simpler select to avoid complex joins that might trigger RLS recursion
      query = supabase.from(table).select(select || "*")
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(column, value)
          } else if (typeof value === "object" && value !== null) {
            // Handle complex filters
            Object.entries(value).forEach(([operator, operatorValue]) => {
              switch (operator) {
                case "gt":
                  query = query.gt(column, operatorValue)
                  break
                case "lt":
                  query = query.lt(column, operatorValue)
                  break
                case "gte":
                  query = query.gte(column, operatorValue)
                  break
                case "lte":
                  query = query.lte(column, operatorValue)
                  break
                case "like":
                  query = query.like(column, operatorValue)
                  break
                case "ilike":
                  query = query.ilike(column, operatorValue)
                  break
                default:
                  query = query.eq(column, operatorValue)
              }
            })
          } else {
            query = query.eq(column, value)
          }
        }
      })
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data, error } = await query

    if (error) {
      console.error(`[v0] API Client error for table ${table}:`, error)
      throw error
    }

    // Cache the result with tags if provided
    if (cache && data) {
      if (tags) {
        apiCache.setWithTags(key, data, tags, cacheTTL)
      } else {
        apiCache.set(key, data, cacheTTL)
      }
    }

    return data as T
  }

  private hashOptions(options: any): string {
    return btoa(JSON.stringify(options))
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 16)
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase.from(table).insert(data).select().single()

    if (error) throw error

    // Invalidate related cache entries by tags
    apiCache.invalidateByTag(table)
    apiCache.invalidateByTag(`${table}_list`)
    apiCache.invalidatePattern(`${table}_.*`)

    return result as T
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

    if (error) throw error

    // Invalidate specific item and related lists
    apiCache.invalidateByTag(`${table}_${id}`)
    apiCache.invalidateByTag(`${table}_list`)
    apiCache.invalidatePattern(`${table}_.*`)

    return result as T
  }

  async delete(table: string, id: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) throw error

    // Clean up all related cache entries
    apiCache.invalidateByTag(`${table}_${id}`)
    apiCache.invalidateByTag(`${table}_list`)
    apiCache.invalidatePattern(`${table}_.*`)
  }

  async batchGet<T>(requests: Array<{ table: string; options?: any }>): Promise<T[]> {
    const results = await Promise.all(requests.map(({ table, options }) => this.get<T>(table, options)))
    return results
  }

  async batchCreate<T>(table: string, items: Partial<T>[]): Promise<T[]> {
    const supabase = getSupabaseClient()
    const { data: results, error } = await supabase.from(table).insert(items).select()

    if (error) throw error

    // Invalidate related caches
    apiCache.invalidateByTag(table)
    apiCache.invalidateByTag(`${table}_list`)

    return results as T[]
  }

  async rpc<T>(functionName: string, params?: Record<string, any>, options: ApiOptions = {}): Promise<T> {
    const { cache = false, cacheTTL, cacheKey } = options

    const key = cacheKey || `rpc_${functionName}_${this.hashOptions(params || {})}`

    if (cache) {
      const cached = apiCache.get<T>(key)
      if (cached) return cached
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc(functionName, params)

    if (error) throw error

    if (cache && data) {
      apiCache.set(key, data, cacheTTL)
    }

    return data as T
  }
}

export const apiClient = ApiClient.getInstance()
