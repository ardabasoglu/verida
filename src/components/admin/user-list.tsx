'use client';

import { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserRoleManager from './user-role-manager';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

interface UserListProps {
  users: User[];
  pagination: Pagination;
  loading: boolean;
  currentUser?: CurrentUser;
  onPageChange: (page: number) => void;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

export default function UserList({
  users,
  pagination,
  loading,
  currentUser,
  onPageChange,
  onUserUpdated,
  onUserDeleted,
}: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        return 'Sistem Yöneticisi';
      case UserRole.ADMIN:
        return 'Yönetici';
      case UserRole.EDITOR:
        return 'Editör';
      case UserRole.MEMBER:
        return 'Üye';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        return 'accent';
      case UserRole.ADMIN:
        return 'red';
      case UserRole.EDITOR:
        return 'blue';
      case UserRole.MEMBER:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
      )
    ) {
      return;
    }

    try {
      setDeletingUserId(userId);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kullanıcı silinirken hata oluştu');
      }

      onUserDeleted();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Kullanıcı silinirken hata oluştu'
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setShowRoleManager(true);
  };

  const handleEditName = (user: User) => {
    setEditingUserId(user.id);
    setEditingName(user.name || '');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingName('');
  };

  const handleSaveName = async (userId: string) => {
    if (!editingName.trim()) {
      alert('İsim boş olamaz');
      return;
    }

    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'İsim güncellenirken hata oluştu');
      }

      setEditingUserId(null);
      setEditingName('');
      onUserUpdated();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'İsim güncellenirken hata oluştu'
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const canModifyUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false; // Can't modify self

    // System admin can modify anyone except themselves
    if (currentUser.role === UserRole.SYSTEM_ADMIN) return true;

    // Admin can modify editors and members, but not system admins or other admins
    if (currentUser.role === UserRole.ADMIN) {
      return user.role === UserRole.EDITOR || user.role === UserRole.MEMBER;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="bg-card shadow rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Kullanıcılar</h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card shadow rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Kullanıcılar</h3>
        </div>
        <div className="p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-foreground">
            Kullanıcı bulunamadı
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Arama kriterlerinize uygun kullanıcı bulunamadı.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Kullanıcılar ({pagination.total})
          </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aktivite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-foreground">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        {editingUserId === user.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="text-sm font-medium text-foreground bg-background border border-border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Kullanıcı adı"
                              disabled={updatingUserId === user.id}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveName(user.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveName(user.id)}
                                disabled={updatingUserId === user.id}
                                className="h-6 w-6 p-0"
                              >
                                {updatingUserId === user.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                ) : (
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={updatingUserId === user.id}
                                className="h-6 w-6 p-0"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-foreground">
                              {user.name || 'İsimsiz Kullanıcı'}
                            </div>
                            {canModifyUser(user) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditName(user)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      label={getRoleDisplayName(user.role)}
                      color={getRoleBadgeColor(user.role)}
                      className="text-xs px-2 py-1"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>{user._count.pages} sayfa</div>
                      <div>{user._count.comments} yorum</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      label={user.emailVerified ? 'Aktif' : 'Beklemede'}
                      color={user.emailVerified ? 'green' : 'yellow'}
                      className="text-xs px-2 py-1"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {canModifyUser(user) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user)}
                          >
                            Rol Değiştir
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id
                              ? 'Siliniyor...'
                              : 'Sil'}
                          </Button>
                        </>
                      )}
                      {currentUser?.id === user.id && (
                        <span className="text-xs text-muted-foreground italic">
                          Siz
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Sonraki
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>
                  {' - '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>
                  {' / '}
                  <span className="font-medium">{pagination.total}</span>
                  {' sonuç gösteriliyor'}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="rounded-l-md"
                  >
                    Önceki
                  </Button>

                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          className="rounded-none"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-r-md"
                  >
                    Sonraki
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Manager Modal */}
      {showRoleManager && selectedUser && (
        <UserRoleManager
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => {
            setShowRoleManager(false);
            setSelectedUser(null);
          }}
          onRoleUpdated={() => {
            setShowRoleManager(false);
            setSelectedUser(null);
            onUserUpdated();
          }}
        />
      )}
    </>
  );
}
