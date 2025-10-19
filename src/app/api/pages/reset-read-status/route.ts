import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow SYSTEM_ADMIN to reset read status
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - System Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body to get target user ID (optional)
    const body = await request.json().catch(() => ({}));
    const { targetUserId, resetAll } = body;

    const whereClause: {
      action: string;
      resourceType: string;
      userId?: string;
    } = {
      action: 'PAGE_VIEWED',
      resourceType: 'PAGE',
    };

    let message = '';

    if (resetAll) {
      // Reset for all users
      message = 'Tüm kullanıcıların okuma durumu sıfırlandı';
    } else if (targetUserId) {
      // Reset for specific user
      whereClause.userId = targetUserId;
      message = 'Belirtilen kullanıcının okuma durumu sıfırlandı';
    } else {
      // Reset for current admin user only
      whereClause.userId = session.user.id;
      message = 'Kendi okuma durumunuz sıfırlandı';
    }

    // Delete PAGE_VIEWED activity logs
    const deletedLogs = await prisma.activityLog.deleteMany({
      where: whereClause,
    });

    const response: ApiResponse = {
      success: true,
      message: `${message} (${deletedLogs.count} kayıt silindi)`,
      data: { deletedCount: deletedLogs.count },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting read status:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Okuma durumu sıfırlanırken hata oluştu',
    };

    return NextResponse.json(response, { status: 500 });
  }
}