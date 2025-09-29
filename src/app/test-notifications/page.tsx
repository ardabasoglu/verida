'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';

export default function TestNotificationsPage() {
  const { data: session } = useSession();
  const { createNotification, refreshUnreadCount } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleCreateTestNotification = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const result = await createNotification({
        userId: session.user.id,
        title: 'Test Bildirimi',
        message: 'Bu bir test bildirimidir. Sistem çalışıyor!',
        type: 'test',
      });

      if (result.success) {
        alert('Test bildirimi oluşturuldu!');
        refreshUnreadCount();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      alert('Bildirim oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Bildirim Sistemi Testi</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Bu sayfa bildirim sistemini test etmek için kullanılır.
          </p>
          
          <Button
            onClick={handleCreateTestNotification}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Oluşturuluyor...' : 'Test Bildirimi Oluştur'}
          </Button>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Test Adımları:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Yukarıdaki butona tıklayın</li>
              <li>Sağ üst köşedeki bildirim simgesinde sayı artışını kontrol edin</li>
              <li>Bildirim simgesine tıklayarak bildirim merkezini açın</li>
              <li>Test bildiriminin görüntülendiğini kontrol edin</li>
              <li>Bildirimi okundu olarak işaretleyin</li>
              <li>Gerçek zamanlı bildirim toast&apos;ının göründüğünü kontrol edin</li>
            </ol>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}