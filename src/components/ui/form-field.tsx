'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  description?: string;
  icon?: React.ReactNode;
  help?: React.ReactNode;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  description,
  icon,
  help,
}: FormFieldProps) {
  const fieldId = React.useId();
  return (
    <div className={cn('space-y-1', className)}>
      {(label || icon || help) && (
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {label && (
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-foreground"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {help && (
            <span className="text-xs text-muted-foreground ml-2">{help}</span>
          )}
        </div>
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="relative">
        {React.isValidElement(children) &&
        typeof children.type === 'string' &&
        ['input', 'select', 'textarea'].includes(children.type)
          ? React.cloneElement(children, {
              'aria-invalid': !!error,
              'aria-describedby': description ? `${fieldId}-desc` : undefined,
            } as React.HTMLAttributes<HTMLInputElement>)
          : children}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
        error &&
          'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
        error &&
          'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  error,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
        error &&
          'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Form validation hook
import { useState, useCallback } from 'react';
import { z } from 'zod';

export function useFormValidation<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(
    async (data: T): Promise<boolean> => {
      setIsValidating(true);
      try {
        await schema.parseAsync(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Partial<Record<keyof T, string>> = {};
          error.issues.forEach((err) => {
            if (err.path.length > 0) {
              const field = err.path[0] as keyof T;
              fieldErrors[field] = err.message;
            }
          });
          setErrors(fieldErrors);
        }
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [schema]
  );

  const validateField = useCallback(
    async (field: keyof T, value: unknown): Promise<boolean> => {
      try {
        // Validate the entire form data with just this field
        const testData = { [field]: value } as Partial<T>;
        await schema.parseAsync(testData);

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.issues[0]?.message;
          if (fieldError) {
            setErrors((prev) => ({ ...prev, [field]: fieldError }));
          }
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValidating,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}
