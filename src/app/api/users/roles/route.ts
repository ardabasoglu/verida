import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessAdminRoutes } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

// GET /api/users/roles - Get available user roles (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require admin role
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roles = [
      {
        value: UserRole.MEMBER,
        label: 'Üye',
        description: 'Sadece içerik görüntüleme ve yorum ekleme yetkisi'
      },
      {
        value: UserRole.EDITOR,
        label: 'Editör',
        description: 'İçerik oluşturma ve düzenleme yetkisi'
      },
      {
        value: UserRole.ADMIN,
        label: 'Yönetici',
        description: 'Kullanıcı yönetimi ve tüm içerik yetkileri'
      },
      {
        value: UserRole.SYSTEM_ADMIN,
        label: 'Sistem Yöneticisi',
        description: 'Tam sistem erişimi ve teknik yönetim yetkisi'
      }
    ]

    return NextResponse.json({ roles })

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}