import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAdminRoutes } from '@/lib/auth-utils'

// GET /api/users/test - Simple test endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require admin role
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Simple query without complex filtering
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      users,
      message: 'Users fetched successfully'
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}