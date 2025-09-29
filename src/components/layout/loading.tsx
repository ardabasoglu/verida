'use client';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-2 border-border border-t-primary ${sizeClasses[size]}`}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function LoadingPage({ text = 'Yükleniyor...' }: { text?: string }) {
  return (
    <div className="min-h-screen-safe flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function LoadingCard({ text }: { text?: string }) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-8">
      <Loading text={text} />
    </div>
  );
}
