'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import UserManagementDashboard from '@/components/admin/user-management-dashboard';

export default function UsersPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oturum Açmanız Gerekiyor
          </h1>
          <p className="text-gray-600">
            Bu sayfayı görüntülemek için lütfen oturum açın.
          </p>
        </div>
      </div>
    );
  }

  const canAccess =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.SYSTEM_ADMIN;

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erişim Reddedildi
          </h1>
          <p className="text-gray-600">
            Bu sayfayı görüntülemek için yönetici yetkilerine sahip olmanız
            gerekir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* User Management Dashboard */}
      <UserManagementDashboard />
    </div>
  );
}
