import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminRoutes } from '@/lib/auth-utils';

export default async function AuthTestPage() {
  const session = await getServerSession(authOptions);
  
  // Test the function step by step
  const hasSession = !!session;
  const hasUser = !!session?.user;
  const userRole = session?.user?.role;
  const canAccess = canAccessAdminRoutes(session);
  
  // Manual test
  const manualCheck = session?.user?.role === 'SYSTEM_ADMIN' || session?.user?.role === 'ADMIN';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      <div className="space-y-2">
        <div>Has Session: {hasSession ? 'Yes' : 'No'}</div>
        <div>Has User: {hasUser ? 'Yes' : 'No'}</div>
        <div>User Role: &quot;{userRole}&quot;</div>
        <div>Can Access (function): {canAccess ? 'Yes' : 'No'}</div>
        <div>Manual Check: {manualCheck ? 'Yes' : 'No'}</div>
        
        <div className="mt-4">
          <strong>Step by step debug:</strong>
          <div>1. session exists: {!!session ? 'Yes' : 'No'}</div>
          <div>2. session.user exists: {!!session?.user ? 'Yes' : 'No'}</div>
          <div>3. session.user.role: &quot;{session?.user?.role}&quot;</div>
          <div>4. typeof role: {typeof session?.user?.role}</div>
          <div>5. role === &apos;SYSTEM_ADMIN&apos;: {session?.user?.role === 'SYSTEM_ADMIN' ? 'Yes' : 'No'}</div>
          <div>6. role === &apos;ADMIN&apos;: {session?.user?.role === 'ADMIN' ? 'Yes' : 'No'}</div>
        </div>
        
        {canAccess ? (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
            ✅ You should be able to access admin routes!
          </div>
        ) : (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
            ❌ Access denied to admin routes
          </div>
        )}
      </div>
    </div>
  );
}