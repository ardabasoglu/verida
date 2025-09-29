import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContentType } from '@prisma/client'

/**
 * GET /api/pages/stats - Get page statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get total page count
    const total = await prisma.page.count({
      where: { published: true }
    })

    // Get count by page type
    const byTypeResults = await prisma.page.groupBy({
      by: ['pageType'],
      where: { published: true },
      _count: {
        id: true
      }
    })

    // Convert to object format
    const byType: Record<ContentType, number> = {
      INFO: 0,
      PROCEDURE: 0,
      ANNOUNCEMENT: 0,
      WARNING: 0
    }

    byTypeResults.forEach(result => {
      byType[result.pageType] = result._count.id
    })

    // Get recent pages count (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCount = await prisma.page.count({
      where: {
        published: true,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const stats = {
      total,
      byType,
      recentCount
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching page stats:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}