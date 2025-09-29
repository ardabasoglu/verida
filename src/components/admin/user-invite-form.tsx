'use client';

import { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UserInviteFormProps {
  onClose: () => void;
  onUserCreated: () => void;
}

export default function UserInviteForm({
  onClose,
  onUserCreated,
}: UserInviteFormProps) {
  const [formData, setFormData] = useState<{
    email: string;
    name: string;
    role: UserRole;
  }>({
    email: '',
    name: '',
    role: UserRole.MEMBER,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      setError('E-posta ve isim alanları zorunludur');
      return;
    }

    if (!formData.email.endsWith('@dgmgumruk.com')) {
      setError('E-posta adresi @dgmgumruk.com uzantılı olmalıdır');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Kullanıcı oluşturulurken hata oluştu'
        );
      }

      onUserCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir kullanıcı oluşturun ve sisteme ekleyin.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              E-posta Adresi *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@dgmgumruk.com"
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              E-posta adresi @dgmgumruk.com uzantılı olmalıdır
            </p>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Ad Soyad *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Kullanıcının tam adı"
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Rol
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value as UserRole }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.MEMBER}>
                  {getRoleDisplayName(UserRole.MEMBER)}
                </SelectItem>
                <SelectItem value={UserRole.EDITOR}>
                  {getRoleDisplayName(UserRole.EDITOR)}
                </SelectItem>
                <SelectItem value={UserRole.ADMIN}>
                  {getRoleDisplayName(UserRole.ADMIN)}
                </SelectItem>
                <SelectItem value={UserRole.SYSTEM_ADMIN}>
                  {getRoleDisplayName(UserRole.SYSTEM_ADMIN)}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Kullanıcının sistem içindeki yetkilerini belirler
            </p>
          </div>

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

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Kullanıcı oluşturulduktan sonra e-posta adresi otomatik olarak
                  doğrulanacak ve sisteme giriş yapabilecektir.
                </p>
              </div>
            </div>
          </div>

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
