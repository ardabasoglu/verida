/**
 * In-memory caching utility for performance optimization
 * Provides simple LRU-like caching with TTL support
 */

interface CacheItem<T> {
  value: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // If cache is at max size, remove oldest item
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    }
  }

  /**
   * Clean expired items
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get all keys in the cache
   */
  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}

// Create singleton instances for different cache types
export const pageCache = new MemoryCache(500, 10 * 60 * 1000) // 10 minutes for pages
export const searchCache = new MemoryCache(200, 5 * 60 * 1000) // 5 minutes for search results
export const userCache = new MemoryCache(100, 15 * 60 * 1000) // 15 minutes for user data
export const statsCache = new MemoryCache(50, 30 * 60 * 1000) // 30 minutes for statistics

/**
 * Cache key generators
 */
export const CacheKeys = {
  page: (id: string) => `page:${id}`,
  pageList: (params: Record<string, unknown>) => `pages:${JSON.stringify(params)}`,
  search: (params: Record<string, unknown>) => `search:${JSON.stringify(params)}`,
  user: (id: string) => `user:${id}`,
  userPages: (userId: string) => `user:${userId}:pages`,
  pageComments: (pageId: string) => `page:${pageId}:comments`,
  pageStats: (pageId: string) => `page:${pageId}:stats`,
  globalStats: () => 'stats:global',
  tagList: () => 'tags:all',
  notificationCount: (userId: string) => `notifications:${userId}:count`
}

/**
 * Cache wrapper function for async operations
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: MemoryCache = pageCache,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch data and cache it
  const data = await fetcher()
  cache.set(key, data, ttl)
  return data
}

/**
 * Invalidate related cache entries
 */
export const CacheInvalidation = {
  page: (pageId: string) => {
    pageCache.delete(CacheKeys.page(pageId))
    // Invalidate page lists that might contain this page
    const keys = Array.from(pageCache.keys())
    keys.forEach(key => {
      if (key.startsWith('pages:')) {
        pageCache.delete(key)
      }
    })
  },

  user: (userId: string) => {
    userCache.delete(CacheKeys.user(userId))
    userCache.delete(CacheKeys.userPages(userId))
  },

  search: () => {
    searchCache.clear()
  },

  pageComments: (pageId: string) => {
    pageCache.delete(CacheKeys.pageComments(pageId))
    pageCache.delete(CacheKeys.pageStats(pageId))
  },

  stats: () => {
    statsCache.clear()
  }
}

/**
 * Periodic cleanup of expired cache entries
 */
setInterval(() => {
  pageCache.cleanup()
  searchCache.cleanup()
  userCache.cleanup()
  statsCache.cleanup()
}, 5 * 60 * 1000) // Cleanup every 5 minutes