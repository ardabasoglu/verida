'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { NotificationPreference } from '@prisma/client';

interface NotificationPreferencesData {
  inAppNotifications: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    inAppNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load current preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();

      if (data.success && data.data) {
        setPreferences({
          inAppNotifications: data.data.inAppNotifications,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Tercihler yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (
    newPreferences: NotificationPreferencesData
  ) => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(newPreferences);
        setMessage({
          type: 'success',
          text: 'Tercihleriniz başarıyla güncellendi',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Güncelleme sırasında hata oluştu',
        });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: 'Güncelleme sırasında hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferencesData) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    updatePreferences(newPreferences);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-border rounded w-3/4"></div>
        <div className="h-12 bg-border rounded"></div>
        <div className="h-4 bg-border rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-md flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckIcon className="h-5 w-5 text-green-600" />
          ) : (
            <XMarkIcon className="h-5 w-5 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Notification Settings */}
      <div className="space-y-6">
        {/* In-App Notifications */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex-1">
            <h3 className="text-base font-medium text-foreground">
              Uygulama İçi Bildirimler
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Yeni duyurular, uyarılar ve yorumlar için uygulama içi bildirimler
              alın
            </p>
          </div>
          <Switch
            checked={preferences.inAppNotifications}
            onChange={() => handleToggle('inAppNotifications')}
            disabled={saving}
            className={`${
              preferences.inAppNotifications ? 'bg-blue-600' : 'bg-border'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
          >
            <span
              className={`${
                preferences.inAppNotifications
                  ? 'translate-x-6'
                  : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-card transition-transform`}
            />
          </Switch>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">
                Bildirim Türleri
              </h4>
              <div className="mt-2 text-sm text-blue-800">
                <ul className="list-disc list-inside space-y-1">
                  <li>Yeni duyurular yayınlandığında</li>
                  <li>Önemli uyarılar paylaşıldığında</li>
                  <li>Sayfalarınıza yorum eklendiğinde</li>
                  <li>İçerikler güncellendiğinde</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Info */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Bildirim Ayarları Hakkında
          </h4>
          <p className="text-sm text-muted-foreground">
            Bu ayarlar sadece uygulama içi bildirimleri etkiler. Sistem,
            güvenlik nedeniyle e-posta bildirimleri göndermez. Tüm bildirimler
            gerçek zamanlı olarak uygulama içinde görüntülenir.
          </p>
        </div>
      </div>
    </div>
  );
}
