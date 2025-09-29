'use client';

import { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}

interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

interface UserRoleManagerProps {
  user: User;
  currentUser?: CurrentUser;
  onClose: () => void;
  onRoleUpdated: () => void;
}

export default function UserRoleManager({
  user,
  currentUser,
  onClose,
  onRoleUpdated,
}: UserRoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        return 'Sistem ayarları ve teknik erişim yetkilerine sahiptir. Tüm kullanıcıları yönetebilir.';
      case UserRole.ADMIN:
        return 'Kullanıcı ekleme, silme, düzenleme ve yetki verme yetkilerine sahiptir.';
      case UserRole.EDITOR:
        return 'İçerik oluşturma ve düzenleme yetkilerine sahiptir.';
      case UserRole.MEMBER:
        return 'Sadece içerik görüntüleme ve yorum ekleme yetkilerine sahiptir.';
      default:
        return '';
    }
  };

  const canAssignRole = (role: UserRole) => {
    if (!currentUser) return false;

    // System admin can assign any role
    if (currentUser.role === UserRole.SYSTEM_ADMIN) return true;

    // Admin can assign editor and member roles, but not system admin or admin
    if (currentUser.role === UserRole.ADMIN) {
      return role === UserRole.EDITOR || role === UserRole.MEMBER;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === user.role) {
      onClose();
      return;
    }

    if (!canAssignRole(selectedRole)) {
      setError('Bu rolü atama yetkiniz bulunmamaktadır');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rol güncellenirken hata oluştu');
      }

      onRoleUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = Object.values(UserRole).filter((role) =>
    canAssignRole(role)
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcı Rolü Değiştir</DialogTitle>
          <DialogDescription>
            {user.name || user.email} kullanıcısının rolünü değiştirin.
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="mb-6 p-4 bg-muted rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-foreground">
                {user.name || 'İsimsiz Kullanıcı'}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="text-xs text-muted-foreground">
                Mevcut rol: {getRoleDisplayName(user.role)}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Yeni Rol Seçin
            </label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              className="space-y-3"
            >
              {availableRoles.map((role) => (
                <div key={role} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={role}
                    id={`role-${role}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={`role-${role}`} className="cursor-pointer">
                      <div className="text-sm font-medium text-foreground">
                        {getRoleDisplayName(role)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getRoleDescription(role)}
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Warning for role changes */}
          {selectedRole !== user.role && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Kullanıcının rolü{' '}
                    <strong>{getRoleDisplayName(user.role)}</strong> den{' '}
                    <strong>{getRoleDisplayName(selectedRole)}</strong> olarak
                    değiştirilecektir. Bu işlem kullanıcının sistem yetkilerini
                    etkileyecektir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
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

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedRole === user.role}
            >
              {loading ? 'Güncelleniyor...' : 'Rolü Güncelle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
