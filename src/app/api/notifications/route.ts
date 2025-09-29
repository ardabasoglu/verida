import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ApiResponse, CreateNotificationRequest } from '@/types';

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(50),
});

const getNotificationsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  unreadOnly: z.string().optional().transform(val => val === 'true'),
});

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = getNotificationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      unreadOnly: searchParams.get('unreadOnly'),
    });

    const where = {
      userId: session.user.id,
      ...(params.unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: notifications,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification (admin/system use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to create notifications (admin or system admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: CreateNotificationRequest = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}