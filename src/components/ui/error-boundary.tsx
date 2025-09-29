'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bir hata oluştu
            </h2>
            <p className="text-muted-foreground mb-6">
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer font-medium text-foreground mb-2">
                  Hata Detayları (Geliştirme Modu)
                </summary>
                <pre className="text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="space-x-3">
              <Button
                onClick={this.handleRetry}
                className="inline-flex items-center space-x-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Tekrar Dene</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple error display component
export type ErrorDisplayType = 'error' | 'warning' | 'info' | 'success';

interface ErrorDisplayProps {
  message: string | Error;
  type?: ErrorDisplayType;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onRetry?: () => void;
  className?: string;
}

const typeConfig: Record<
  ErrorDisplayType,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    title: string;
    text: string;
  }
> = {
  error: {
    icon: (
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
    ),
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'Hata',
    text: 'text-red-700',
  },
  warning: {
    icon: (
      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
    ),
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    title: 'Uyarı',
    text: 'text-yellow-700',
  },
  info: {
    icon: (
      <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
    ),
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Bilgi',
    text: 'text-blue-700',
  },
  success: {
    icon: (
      <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
    ),
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'Başarılı',
    text: 'text-green-700',
  },
};

export function ErrorDisplay({
  message,
  type = 'error',
  title,
  action,
  onRetry,
  className,
}: ErrorDisplayProps) {
  const config = typeConfig[type];
  const displayMessage =
    typeof message === 'string' ? message : message.message;

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 ${className || ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start space-x-3">
        {config.icon}
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${config.text}`}>
            {title || config.title}
          </h3>
          <p className={`mt-1 text-sm ${config.text}`}>{displayMessage}</p>
          {(action || onRetry) && (
            <div className="mt-3 flex space-x-2">
              {action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={action.onClick}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  {action.label}
                </Button>
              )}
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Tekrar Dene
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className || ''}`}>
      {icon && <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
