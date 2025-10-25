import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">Sayfa Bulunamadı</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Aradığınız sayfa bulunamadı. Sayfa silinmiş, taşınmış veya erişim izniniz bulunmuyor olabilir.
      </p>
      <Link href="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  );
}