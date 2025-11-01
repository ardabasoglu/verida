import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAdminRoutes } from '@/lib/auth-utils'
import { updateUserSchema, userIdSchema } from '@/lib/validations/user'
import { z } from 'zod'

// GET /api/users/[id] - Get user by ID (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require admin role
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate user ID
    const resolvedParams = await params
    const { id } = userIdSchema.parse(resolvedParams)

    const user = await prisma.user.findUnique({
      where: { id },
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
            files: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require admin role
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate user ID
    const resolvedParams = await params
    const { id } = userIdSchema.parse(resolvedParams)

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, name: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-role modification for safety
    if (session.user.id === id && validatedData.role) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 403 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
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
        userId: session.user.id,
        action: 'USER_UPDATED_BY_ADMIN',
        resourceType: 'User',
        resourceId: updatedUser.id,
        details: {
          updatedUserEmail: updatedUser.email,
          previousRole: existingUser.role,
          newRole: updatedUser.role,
          previousName: existingUser.name,
          newName: updatedUser.name,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require admin role
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate user ID
    const resolvedParams = await params
    const { id } = userIdSchema.parse(resolvedParams)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    // Delete user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED_BY_ADMIN',
        resourceType: 'User',
        resourceId: id,
        details: {
          deletedUserEmail: existingUser.email,
          deletedUserRole: existingUser.role,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}