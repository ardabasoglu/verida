import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPerformanceReport, performanceMonitor } from '@/lib/performance-monitor'
import { pageCache, searchCache, userCache, statsCache } from '@/lib/cache'

/**
 * GET /api/performance - Get performance metrics and cache statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const isAdmin = ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get performance report
    const performanceReport = getPerformanceReport()
    
    // Get cache statistics
    const cacheStats = {
      pageCache: pageCache.getStats(),
      searchCache: searchCache.getStats(),
      userCache: userCache.getStats(),
      statsCache: statsCache.getStats()
    }

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceReport,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/performance - Clear performance metrics and cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has system admin role
    const isSystemAdmin = session.user.role === 'SYSTEM_ADMIN'
    
    if (!isSystemAdmin) {
      return NextResponse.json(
        { error: 'System admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clearCache = searchParams.get('cache') === 'true'
    const clearMetrics = searchParams.get('metrics') === 'true'

    if (clearCache) {
      pageCache.clear()
      searchCache.clear()
      userCache.clear()
      statsCache.clear()
    }

    if (clearMetrics) {
      performanceMonitor.clear()
    }

    return NextResponse.json({
      success: true,
      message: 'Performance data cleared successfully',
      cleared: {
        cache: clearCache,
        metrics: clearMetrics
      }
    })

  } catch (error) {
    console.error('Error clearing performance data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}