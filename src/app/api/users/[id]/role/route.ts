import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import { updateUserRoleSchema, userIdSchema } from '@/lib/validations/user'
import { z } from 'zod'

// PUT /api/users/[id]/role - Update user role (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const currentUser = await requireAdmin()

    // Validate user ID
    const resolvedParams = await params
    const { id } = userIdSchema.parse(resolvedParams)

    const body = await request.json()
    const { role } = updateUserRoleSchema.parse(body)

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
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 403 }
      )
    }

    // Only SYSTEM_ADMIN can assign SYSTEM_ADMIN role
    if (role === UserRole.SYSTEM_ADMIN && currentUser.role !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: 'Only System Administrators can assign System Administrator role' },
        { status: 403 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'User',
        resourceId: updatedUser.id,
        details: {
          targetUserEmail: updatedUser.email,
          previousRole: existingUser.role,
          newRole: role,
          changedBy: currentUser.email,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}