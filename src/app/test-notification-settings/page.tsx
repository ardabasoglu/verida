import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout/main-layout';
import { Container } from '@/components/layout/container';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { NotificationHistory } from '@/components/settings/notification-history';

export default function TestNotificationSettingsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Container size="lg" className="py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Bildirim Ayarları Test Sayfası
              </h1>
              <p className="text-gray-600 mt-2">
                Bu sayfa bildirim tercihlerini ve geçmişini test etmek için oluşturulmuştur.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notification Preferences */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bildirim Tercihleri
                </h2>
                <NotificationPreferences />
              </div>

              {/* Notification History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bildirim Geçmişi (Son 10)
                </h2>
                <NotificationHistory limit={10} showFilters={false} />
              </div>
            </div>
          </div>
        </Container>
      </MainLayout>
    </AuthGuard>
  );
}