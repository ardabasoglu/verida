import * as React from 'react';

import { cn } from '@/lib/utils';

type CardVariant =
  | 'default'
  | 'elevated'
  | 'outlined'
  | 'accent'
  | 'flat'
  | 'info'
  | 'warning'
  | 'success'
  | 'error';

const CARD_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  elevated: 'rounded-lg border bg-card text-card-foreground shadow-lg',
  outlined: 'rounded-lg border-2 border-accent bg-card text-card-foreground',
  accent: 'rounded-lg border bg-accent text-accent-foreground shadow-sm',
  flat: 'rounded-lg bg-card text-card-foreground',
  info: 'rounded-lg border border-blue-200 bg-blue-50 text-blue-900 shadow-sm',
  warning:
    'rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-900 shadow-sm',
  success:
    'rounded-lg border border-green-200 bg-green-50 text-green-900 shadow-sm',
  error: 'rounded-lg border border-red-200 bg-red-50 text-red-900 shadow-sm',
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(CARD_VARIANT_CLASSES[variant], className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">{children}</div>
        {actions && <div className="ml-4">{actions}</div>}
      </div>
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {actions && <div className="ml-4">{actions}</div>}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
