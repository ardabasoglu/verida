'use client';

import { Toaster } from 'react-hot-toast';
import { RealTimeNotifications } from '@/components/notifications/real-time-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RealTimeNotifications />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}