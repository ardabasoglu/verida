import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ReadStatusManager from '@/components/admin/read-status-manager';

export default async function ReadStatusPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'SYSTEM_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Okuma Durumu Yönetimi</h1>
          <p className="text-muted-foreground mt-2">
            Kullanıcıların sayfa okuma durumlarını yönetin ve sıfırlayın
          </p>
        </div>

        <ReadStatusManager />
      </div>
    </div>
  );
}