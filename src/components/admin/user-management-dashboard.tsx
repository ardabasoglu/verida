'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import UserList from './user-list';
import UserInviteForm from './user-invite-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    pages: number;
    comments: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserManagementDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '' as UserRole | '',
  });

  const fetchUsers = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (role) params.append('role', role);

      const response = await fetch(`/api/users?${params}`);

      if (!response.ok) {
        throw new Error('Kullanıcılar yüklenirken hata oluştu');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, filters.search, filters.role);
  }, [pagination.page, filters.search, filters.role]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role: UserRole | '') => {
    setFilters((prev) => ({ ...prev, role }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleUserCreated = () => {
    setShowInviteForm(false);
    fetchUsers(1, filters.search, filters.role);
  };

  const handleUserUpdated = () => {
    fetchUsers(pagination.page, filters.search, filters.role);
  };

  const handleUserDeleted = () => {
    fetchUsers(pagination.page, filters.search, filters.role);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Role Filter */}
          <Select
            value={filters.role || 'all'}
            onValueChange={(value) =>
              handleRoleFilter(value === 'all' ? '' : (value as UserRole))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tüm Roller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Roller</SelectItem>
              <SelectItem value={UserRole.SYSTEM_ADMIN}>
                Sistem Yöneticisi
              </SelectItem>
              <SelectItem value={UserRole.ADMIN}>Yönetici</SelectItem>
              <SelectItem value={UserRole.EDITOR}>Editör</SelectItem>
              <SelectItem value={UserRole.MEMBER}>Üye</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add User Button */}
        <Button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center space-x-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Yeni Kullanıcı</span>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <UserList
        users={users}
        pagination={pagination}
        loading={loading}
        currentUser={session?.user}
        onPageChange={handlePageChange}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />

      {/* User Invite Modal */}
      {showInviteForm && (
        <UserInviteForm
          onClose={() => setShowInviteForm(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
}
