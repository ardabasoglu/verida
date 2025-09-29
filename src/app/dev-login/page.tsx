'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DevLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Only show this page in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            This page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  const handleDevLogin = async (userEmail: string) => {
    setIsLoading(true);
    try {
      // Create a verification token manually for development
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Redirect to the callback URL
          window.location.href = result.callbackUrl;
        }
      }
    } catch (error) {
      console.error('Dev login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedUsers = [
    { email: 'admin@dgmgumruk.com', role: 'System Admin' },
    { email: 'yonetici@dgmgumruk.com', role: 'Admin' },
    { email: 'editor@dgmgumruk.com', role: 'Editor' },
    { email: 'calisan@dgmgumruk.com', role: 'Member' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Development Login
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Quick login for development and testing
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Quick Login Options
            </h3>
            <div className="space-y-3">
              {predefinedUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDevLogin(user.email)}
                  disabled={isLoading}
                  className="w-full flex justify-between items-center px-4 py-3 border border-input rounded-md shadow-sm bg-card text-sm font-medium text-card-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
                >
                  <span>{user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Or login with custom email
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground bg-background rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
              placeholder="Enter @dgmgumruk.com email"
            />
          </div>

          <Button
            onClick={() => handleDevLogin(email)}
            disabled={isLoading || !email.endsWith('@dgmgumruk.com')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Dev Login'}
          </Button>

          <div className="text-center">
            <a
              href="/auth/signin"
              className="font-medium text-primary hover:text-primary/80"
            >
              Use normal email login instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
