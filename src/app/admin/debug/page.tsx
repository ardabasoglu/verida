import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdminRoutes, isAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export default async function DebugPage() {
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
      <h1 className="text-2xl font-bold mb-4">Admin Debug Page</h1>
      <div className="space-y-4">
        <div>
          <strong>Session exists:</strong> {session ? 'Yes' : 'No'}
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
          </>
        ) : (
          <div>No database user found</div>
        )}
      </div>
    </div>
  );
}