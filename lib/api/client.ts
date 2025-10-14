import { createClient } from "@supabase/supabase-js"
import { apiCache } from "./cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ApiOptions {
  cache?: boolean
  cacheTTL?: number
  cacheKey?: string
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
    } = {},
  ): Promise<T> {
    const { cache = true, cacheTTL, cacheKey, select = "*", filters, orderBy } = options

    // Generate cache key
    const key = cacheKey || `${table}_${JSON.stringify({ select, filters, orderBy })}`

    // Check cache first
    if (cache) {
      const cached = apiCache.get<T>(key)
      if (cached) return cached
    }

    // Build query
    let query = supabase.from(table).select(select)

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([column, value]) => {
        query = query.eq(column, value)
      })
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data, error } = await query

    if (error) throw error

    // Cache the result
    if (cache && data) {
      apiCache.set(key, data, cacheTTL)
    }

    return data as T
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase.from(table).insert(data).select().single()

    if (error) throw error

    // Invalidate related cache entries
    apiCache.invalidatePattern(`${table}_.*`)

    return result as T
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

    if (error) throw error

    // Invalidate related cache entries
    apiCache.invalidatePattern(`${table}_.*`)

    return result as T
  }

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) throw error

    // Invalidate related cache entries
    apiCache.invalidatePattern(`${table}_.*`)
  }

  // RPC call for complex operations
  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<T> {
    const { data, error } = await supabase.rpc(functionName, params)
    if (error) throw error
    return data as T
  }
}

export const apiClient = ApiClient.getInstance()
