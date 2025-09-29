import React from 'react';

export type BadgeColor =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray'
  | 'accent';

const COLOR_CLASSES: Record<BadgeColor, string> = {
  blue: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-200 dark:text-blue-900 dark:ring-blue-300',
  green:
    'bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-200 dark:text-green-900 dark:ring-green-300',
  yellow:
    'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-200 dark:text-yellow-900 dark:ring-yellow-300',
  red: 'bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-200 dark:text-red-900 dark:ring-red-300',
  gray: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-200 dark:text-gray-900 dark:ring-gray-300',
  accent: 'bg-accent/20 text-accent-foreground ring-1 ring-border',
};

interface BadgeProps {
  label: React.ReactNode;
  color?: BadgeColor;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = 'gray',
  icon,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-[14px]'
      : size === 'md'
        ? 'px-2 py-0.5 text-[12px]'
        : 'px-1.5 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium self-start ${sizeClasses} ${COLOR_CLASSES[color]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </span>
  );
};
