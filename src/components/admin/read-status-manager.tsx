'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, User, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface ReadStatusStats {
  totalUsers: number;
  totalPages: number;
  totalReadEntries: number;
  usersWithReads: number;
}

export default function ReadStatusManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ReadStatusStats | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetAction, setResetAction] = useState<'all' | 'user' | 'self'>('self');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUsers(result.data.users || []);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/activity-logs/statistics');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Calculate read status statistics
          const pageViewedCount = result.data.activitiesByAction?.find(
            (action: { action: string; _count: { action: number } }) => action.action === 'PAGE_VIEWED'
          )?._count?.action || 0;

          // Fetch additional stats
          const [usersResponse, pagesResponse] = await Promise.all([
            fetch('/api/users'),
            fetch('/api/pages'),
          ]);

          let totalUsers = 0;
          let totalPages = 0;

          if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            totalUsers = usersResult.data?.pagination?.total || 0;
          }

          if (pagesResponse.ok) {
            const pagesResult = await pagesResponse.json();
            totalPages = pagesResult.pagination?.total || 0;
          }

          setStats({
            totalUsers,
            totalPages,
            totalReadEntries: pageViewedCount,
            usersWithReads: result.data.topUsers?.length || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const body: { resetAll?: boolean; targetUserId?: string } = {};

      if (resetAction === 'all') {
        body.resetAll = true;
      } else if (resetAction === 'user' && selectedUserId) {
        body.targetUserId = selectedUserId;
      }
      // For 'self', no additional parameters needed

      const response = await fetch('/api/pages/reset-read-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        fetchStats(); // Refresh stats
      } else {
        setMessage({ type: 'error', text: result.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
      console.error('Error resetting read status:', error);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const getConfirmMessage = () => {
    switch (resetAction) {
      case 'all':
        return 'Tüm kullanıcıların okuma durumları sıfırlanacak. Bu işlem geri alınamaz!';
      case 'user':
        const user = users.find(u => u.id === selectedUserId);
        return `${user?.name || user?.email} kullanıcısının okuma durumu sıfırlanacak.`;
      case 'self':
        return 'Kendi okuma durumunuz sıfırlanacak.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-green-600 rounded" />
                <div>
                  <p className="text-sm font-medium">Toplam Sayfa</p>
                  <p className="text-2xl font-bold">{stats.totalPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-purple-600 rounded" />
                <div>
                  <p className="text-sm font-medium">Okuma Kayıtları</p>
                  <p className="text-2xl font-bold">{stats.totalReadEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Aktif Okuyucu</p>
                  <p className="text-2xl font-bold">{stats.usersWithReads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Okuma Durumu Sıfırlama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-type">Sıfırlama Türü</Label>
              <Select value={resetAction} onValueChange={(value: 'all' | 'user' | 'self') => setResetAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Kendi Okuma Durumum</SelectItem>
                  <SelectItem value="user">Belirli Kullanıcı</SelectItem>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Tüm Kullanıcılar
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resetAction === 'user' && (
              <div>
                <Label htmlFor="user-select">Kullanıcı Seçin</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanıcı seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name || user.email}</span>
                          <Badge 
                            label={user.role}
                            color="gray" 
                            className="text-xs"
                          />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || (resetAction === 'user' && !selectedUserId)}
              variant={resetAction === 'all' ? 'destructive' : 'default'}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Okuma Durumunu Sıfırla
            </Button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Okuma Durumu Sıfırlama Onayı
            </DialogTitle>
            <DialogDescription>
              {getConfirmMessage()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              İptal
            </Button>
            <Button
              onClick={handleReset}
              disabled={loading}
              variant={resetAction === 'all' ? 'destructive' : 'default'}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}