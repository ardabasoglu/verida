'use client';

import { ReactNode } from 'react';

interface ResponsiveFormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function ResponsiveForm({
  children,
  onSubmit,
  className = '',
}: ResponsiveFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </form>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormField({
  label,
  children,
  required,
  error,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1 sm:space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 ${className}`}
    >
      {children}
    </div>
  );
}

// Responsive input component
interface ResponsiveInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function ResponsiveInput({
  error,
  className = '',
  ...props
}: ResponsiveInputProps) {
  return (
    <input
      {...props}
      className={`
        w-full px-3 py-2 sm:py-3 
        text-sm sm:text-base
        border rounded-md
        focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
        transition-colors duration-200
        ${
          error
            ? 'border-destructive bg-destructive/10'
            : 'border-border bg-background hover:border-ring'
        }
        ${className}
      `}
    />
  );
}

// Responsive textarea component
interface ResponsiveTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function ResponsiveTextarea({
  error,
  className = '',
  ...props
}: ResponsiveTextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        w-full px-3 py-2 sm:py-3 
        text-sm sm:text-base
        border rounded-md
        focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
        transition-colors duration-200
        resize-vertical
        ${
          error
            ? 'border-destructive bg-destructive/10'
            : 'border-border bg-background hover:border-ring'
        }
        ${className}
      `}
    />
  );
}

// Responsive select component
interface ResponsiveSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function ResponsiveSelect({
  error,
  className = '',
  children,
  ...props
}: ResponsiveSelectProps) {
  return (
    <select
      {...props}
      className={`
        w-full px-3 py-2 sm:py-3 
        text-sm sm:text-base
        border rounded-md 
        focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
        transition-colors duration-200
        bg-background
        ${
          error
            ? 'border-destructive bg-destructive/10'
            : 'border-border hover:border-ring'
        }
        ${className}
      `}
    >
      {children}
    </select>
  );
}
