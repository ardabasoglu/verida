import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import { createUserSchema, userSearchSchema } from '@/lib/validations/user'
import { z } from 'zod'

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    
    // Validate search parameters
    const searchParamsObj = Object.fromEntries(searchParams.entries())
    const validatedParams = userSearchSchema.parse(searchParamsObj)

    const { page, limit, role, search } = validatedParams
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      role?: UserRole;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {}
    
    if (role) {
      where.role = role
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              pages: true,
              comments: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const currentUser = await requireAdmin()

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        emailVerified: new Date(), // Auto-verify for admin-created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'USER_CREATED_BY_ADMIN',
        resourceType: 'User',
        resourceId: newUser.id,
        details: {
          createdUserEmail: newUser.email,
          createdUserRole: newUser.role,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(newUser, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}