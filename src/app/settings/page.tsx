import { MainLayout } from '@/components/layout/main-layout';
import { Container } from '@/components/layout/container';
import { AuthGuard } from '@/components/auth/auth-guard';
import { NotificationPreferences } from '@/components/settings/notification-preferences';
import { NotificationHistory } from '@/components/settings/notification-history';
import { Cog6ToothIcon, BellIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Container size="lg" className="py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3">
                <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
                  <p className="text-gray-600 mt-1">
                    Hesap ayarlarınızı ve bildirim tercihlerinizi yönetin
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <nav className="space-y-2">
                  <a
                    href="#notifications"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <BellIcon className="h-5 w-5" />
                    <span>Bildirim Tercihleri</span>
                  </a>
                  <a
                    href="#history"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ClockIcon className="h-5 w-5" />
                    <span>Bildirim Geçmişi</span>
                  </a>
                </nav>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Notification Preferences */}
                <section id="notifications">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <BellIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Bildirim Tercihleri
                        </h2>
                        <p className="text-gray-600 text-sm">
                          Hangi bildirimleri almak istediğinizi seçin
                        </p>
                      </div>
                    </div>
                    <NotificationPreferences />
                  </div>
                </section>

                {/* Notification History */}
                <section id="history">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <ClockIcon className="h-6 w-6 text-green-600" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Bildirim Geçmişi
                        </h2>
                        <p className="text-gray-600 text-sm">
                          Geçmiş bildirimlerinizi görüntüleyin ve yönetin
                        </p>
                      </div>
                    </div>
                    <NotificationHistory />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </Container>
      </MainLayout>
    </AuthGuard>
  );
}