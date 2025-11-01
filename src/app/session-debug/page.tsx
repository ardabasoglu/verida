import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminRoutes, isAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export default async function SessionDebugPage() {
  const session = await getServerSession(authOptions);
  
  // Also fetch user directly from database for comparison
  let dbUser = null;
  if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true, email: true }
    });
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug Page (No Auth Check)</h1>
      <div className="space-y-4">
        <div>
          <strong>Session exists:</strong> {session ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Full Session Object:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        {session && (
          <>
            <div>
              <strong>User ID:</strong> {session.user?.id || 'undefined'}
            </div>
            <div>
              <strong>User Email:</strong> {session.user?.email || 'undefined'}
            </div>
            <div>
              <strong>User Name:</strong> {session.user?.name || 'undefined'}
            </div>
            <div>
              <strong>User Role:</strong> {session.user?.role || 'undefined'}
            </div>
            <div>
              <strong>Role Type:</strong> {typeof session.user?.role}
            </div>
            <div>
              <strong>Can Access Admin Routes:</strong> {canAccessAdminRoutes(session) ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Is Admin (direct check):</strong> {session.user?.role ? isAdmin(session.user.role) ? 'Yes' : 'No' : 'No role'}
            </div>
            <div>
              <strong>Debug - session?.user exists:</strong> {session?.user ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Debug - session.user.role value:</strong> &quot;{session.user?.role}&quot;
            </div>
            <div>
              <strong>Debug - role comparison:</strong> 
              <ul className="ml-4 mt-1">
                <li>Role === &apos;ADMIN&apos;: {session.user?.role === 'ADMIN' ? 'Yes' : 'No'}</li>
                <li>Role === &apos;SYSTEM_ADMIN&apos;: {session.user?.role === 'SYSTEM_ADMIN' ? 'Yes' : 'No'}</li>
                <li>[&apos;ADMIN&apos;, &apos;SYSTEM_ADMIN&apos;].includes(role): {['ADMIN', 'SYSTEM_ADMIN'].includes(session.user?.role as string) ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </>
        )}
        
        <hr className="my-4" />
        <h2 className="text-xl font-bold">Database User:</h2>
        {dbUser ? (
          <>
            <div>
              <strong>DB User ID:</strong> {dbUser.id}
            </div>
            <div>
              <strong>DB User Email:</strong> {dbUser.email}
            </div>
            <div>
              <strong>DB User Name:</strong> {dbUser.name}
            </div>
            <div>
              <strong>DB User Role:</strong> {dbUser.role}
            </div>
            <div>
              <strong>DB Role Type:</strong> {typeof dbUser.role}
            </div>
            <div>
              <strong>DB User Object:</strong>
              <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(dbUser, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div>No database user found</div>
        )}
      </div>
    </div>
  );
}