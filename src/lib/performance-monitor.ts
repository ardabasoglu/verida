/**
 * Performance monitoring utilities
 * Provides query performance tracking and optimization insights
 */

interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  params?: unknown
  cacheHit?: boolean
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 queries

  /**
   * Track query performance
   */
  trackQuery(query: string, duration: number, params?: unknown, cacheHit = false) {
    const metric: QueryMetrics = {
      query,
      duration,
      timestamp: new Date(),
      params,
      cacheHit
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow queries
    if (duration > 1000) { // Log queries slower than 1 second
      console.warn(`Slow query detected: ${query} took ${duration}ms`, {
        params,
        cacheHit
      })
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        cacheHitRate: 0
      }
    }

    const totalQueries = this.metrics.length
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const averageDuration = totalDuration / totalQueries
    const slowQueries = this.metrics.filter(m => m.duration > 1000).length
    const cacheHits = this.metrics.filter(m => m.cacheHit).length
    const cacheHitRate = (cacheHits / totalQueries) * 100

    return {
      totalQueries,
      averageDuration: Math.round(averageDuration),
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit = 10) {
    return this.metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(m => ({
        query: m.query,
        duration: m.duration,
        timestamp: m.timestamp,
        cacheHit: m.cacheHit
      }))
  }

  /**
   * Get queries by time range
   */
  getQueriesByTimeRange(startTime: Date, endTime: Date) {
    return this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    )
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator for timing async functions
 */
export function timed(name: string) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        
        performanceMonitor.trackQuery(
          `${name}.${propertyKey}`,
          duration,
          args.length > 0 ? args[0] : undefined
        )
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        performanceMonitor.trackQuery(
          `${name}.${propertyKey}`,
          duration,
          args.length > 0 ? args[0] : undefined
        )
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Wrapper for timing database queries
 */
export async function timedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  params?: unknown,
  cacheHit = false
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    performanceMonitor.trackQuery(queryName, duration, params, cacheHit)
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    performanceMonitor.trackQuery(queryName, duration, params, cacheHit)
    throw error
  }
}

/**
 * Performance middleware for API routes
 */
export function withPerformanceTracking(handler: (request: Request, ...args: unknown[]) => Promise<Response>) {
  return async function (request: Request, ...args: unknown[]) {
    const startTime = Date.now()
    const url = new URL(request.url)
    const method = request.method
    const endpoint = `${method} ${url.pathname}`
    
    try {
      const result = await handler(request, ...args)
      const duration = Date.now() - startTime
      
      performanceMonitor.trackQuery(
        `API:${endpoint}`,
        duration,
        { method, pathname: url.pathname }
      )
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      performanceMonitor.trackQuery(
        `API:${endpoint}`,
        duration,
        { method, pathname: url.pathname, error: true }
      )
      throw error
    }
  }
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  const stats = performanceMonitor.getStats()
  const slowestQueries = performanceMonitor.getSlowestQueries(5)
  
  return {
    overview: stats,
    slowestQueries,
    recommendations: generateRecommendations(stats, slowestQueries)
  }
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(stats: ReturnType<typeof performanceMonitor.getStats>, slowQueries: ReturnType<typeof performanceMonitor.getSlowestQueries>) {
  const recommendations: string[] = []
  
  if (stats.averageDuration > 500) {
    recommendations.push('Average query time is high. Consider adding more indexes or optimizing queries.')
  }
  
  if (stats.cacheHitRate < 50) {
    recommendations.push('Cache hit rate is low. Consider increasing cache TTL or improving cache keys.')
  }
  
  if (stats.slowQueries > stats.totalQueries * 0.1) {
    recommendations.push('High number of slow queries detected. Review query optimization.')
  }
  
  if (slowQueries.some(q => q.query.includes('findMany') && q.duration > 2000)) {
    recommendations.push('Slow list queries detected. Consider adding pagination or filtering.')
  }
  
  return recommendations
}