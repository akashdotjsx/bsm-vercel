interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  size: number
  compressed?: boolean
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  entryCount: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly MAX_ENTRIES = 1000
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
  }

  private compress(data: any): { data: string; compressed: boolean } {
    const serialized = JSON.stringify(data)
    if (serialized.length > 1024) {
      // Simple compression simulation (in real app, use actual compression)
      return { data: serialized, compressed: true }
    }
    return { data: serialized, compressed: false }
  }

  private decompress(data: string, compressed: boolean): any {
    if (compressed) {
      // Decompress if needed
      return JSON.parse(data)
    }
    return JSON.parse(data)
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate in bytes
  }

  private evictLRU(): void {
    let oldestKey = ""
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)
      if (entry) {
        this.stats.totalSize -= entry.size
        this.stats.evictions++
      }
      this.cache.delete(oldestKey)
      this.stats.entryCount--
    }
  }

  private ensureCapacity(newEntrySize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.MAX_ENTRIES) {
      this.evictLRU()
    }

    // Check size limit
    while (this.stats.totalSize + newEntrySize > this.MAX_SIZE && this.cache.size > 0) {
      this.evictLRU()
    }
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const size = this.calculateSize(data)
    const compressed = this.compress(data)

    this.ensureCapacity(size)

    // Remove existing entry if it exists
    const existing = this.cache.get(key)
    if (existing) {
      this.stats.totalSize -= existing.size
      this.stats.entryCount--
    }

    this.cache.set(key, {
      data: compressed.data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      compressed: compressed.compressed,
    })

    this.stats.totalSize += size
    this.stats.entryCount++
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.totalSize -= entry.size
      this.stats.entryCount--
      this.stats.misses++
      return null
    }

    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++

    return this.decompress(entry.data, entry.compressed || false)
  }

  setMany<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl)
    })
  }

  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    keys.forEach((key) => {
      result[key] = this.get<T>(key)
    })
    return result
  }

  invalidate(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.stats.totalSize -= entry.size
      this.stats.entryCount--
    }
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
        this.stats.totalSize -= entry.size
        this.stats.entryCount--
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  private tags = new Map<string, Set<string>>() // tag -> set of keys

  setWithTags<T>(key: string, data: T, tags: string[], ttl?: number): void {
    this.set(key, data, ttl)

    // Associate key with tags
    tags.forEach((tag) => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set())
      }
      this.tags.get(tag)!.add(key)
    })
  }

  invalidateByTag(tag: string): void {
    const keys = this.tags.get(tag)
    if (keys) {
      keys.forEach((key) => this.invalidate(key))
      this.tags.delete(tag)
    }
  }

  async warmCache(warmupFunctions: Array<() => Promise<void>>): Promise<void> {
    await Promise.all(warmupFunctions.map((fn) => fn().catch(console.error)))
  }

  getStats(): CacheStats & { hitRate: number; avgAccessCount: number } {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    let totalAccessCount = 0
    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount
    }
    const avgAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0

    return {
      ...this.stats,
      hitRate,
      avgAccessCount,
    }
  }

  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []
    const stats = this.getStats()

    if (stats.hitRate < 0.5) {
      issues.push("Low cache hit rate (< 50%)")
    }

    if (stats.totalSize > this.MAX_SIZE * 0.9) {
      issues.push("Cache size approaching limit")
    }

    if (stats.entryCount > this.MAX_ENTRIES * 0.9) {
      issues.push("Cache entry count approaching limit")
    }

    return {
      healthy: issues.length === 0,
      issues,
    }
  }

  clear(): void {
    this.cache.clear()
    this.tags.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
    }
  }

  export(): string {
    const data = {
      cache: Array.from(this.cache.entries()),
      tags: Array.from(this.tags.entries()).map(([tag, keys]) => [tag, Array.from(keys)]),
      stats: this.stats,
    }
    return JSON.stringify(data)
  }

  import(data: string): void {
    try {
      const parsed = JSON.parse(data)

      this.cache.clear()
      this.tags.clear()

      parsed.cache.forEach(([key, entry]: [string, CacheEntry<any>]) => {
        this.cache.set(key, entry)
      })

      parsed.tags.forEach(([tag, keys]: [string, string[]]) => {
        this.tags.set(tag, new Set(keys))
      })

      this.stats = parsed.stats || this.stats
    } catch (error) {
      console.error("[v0] Failed to import cache data:", error)
    }
  }
}

export const apiCache = new ApiCache()

export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator: (...args: Parameters<T>) => string
    ttl?: number
    tags?: string[]
  },
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator(...args)

    // Try to get from cache first
    const cached = apiCache.get(key)
    if (cached) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)

    if (options.tags) {
      apiCache.setWithTags(key, result, options.tags, options.ttl)
    } else {
      apiCache.set(key, result, options.ttl)
    }

    return result
  }) as T
}
