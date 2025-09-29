import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Verida Kurumsal Bilgi Uygulaması',
  description: 'Kurumsal bilgi yönetimi ve paylaşım platformu',
  keywords: ['kurumsal', 'bilgi', 'yönetim', 'verida', 'blockchain'],
  authors: [{ name: 'Verida Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`h-full ${ibmPlexSans.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased h-full bg-background text-foreground"
        style={{
          fontFamily:
            'var(--font-ibm-plex-sans), "IBM Plex Sans", system-ui, sans-serif',
        }}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <SessionProvider>
              <NotificationProvider>
                <ToastProvider>
                  <div id="root" className="min-h-full">
                    {children}
                  </div>
                </ToastProvider>
              </NotificationProvider>
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
