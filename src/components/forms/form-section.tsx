'use client';

import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'subtle';
}

const SECTION_VARIANTS = {
  default: 'bg-background',
  highlighted: 'bg-muted/30 border border-border rounded-xl p-8',
  subtle: 'bg-muted/10 rounded-lg p-6'
};

export function FormSection({ 
  title, 
  description, 
  children, 
  className,
  variant = 'default'
}: FormSectionProps) {
  return (
    <div className={cn('space-y-8', SECTION_VARIANTS[variant], className)}>
      {/* Section Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
        {description && (
          <p className="text-base text-muted-foreground leading-relaxed ml-4">
            {description}
          </p>
        )}
        <div className="ml-4 w-16 h-0.5 bg-gradient-to-r from-primary to-primary/30 rounded-full"></div>
      </div>
      
      {/* Section Content */}
      <div className={variant === 'default' ? 'ml-4' : ''}>
        {children}
      </div>
    </div>
  );
}

interface FormFieldGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}

export function FormFieldGroup({ 
  children, 
  className,
  columns = 1 
}: FormFieldGroupProps) {
  return (
    <div className={cn(
      'space-y-8',
      columns === 2 && 'md:grid md:grid-cols-2 md:gap-8 md:space-y-0',
      className
    )}>
      {children}
    </div>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}