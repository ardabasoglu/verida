import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes with proper dark mode support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Theme-aware color utilities
 */
export const themeColors = {
  // Background colors
  background: 'bg-background',
  card: 'bg-card',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',

  // Text colors
  foreground: 'text-foreground',
  mutedForeground: 'text-muted-foreground',
  primaryForeground: 'text-primary-foreground',
  secondaryForeground: 'text-secondary-foreground',

  // Border colors
  border: 'border-border',
  input: 'border-input',
  ring: 'ring-ring',

  // Hover states
  hover: {
    background: 'hover:bg-background',
    card: 'hover:bg-card',
    muted: 'hover:bg-muted',
    primary: 'hover:bg-primary',
    secondary: 'hover:bg-secondary',
  },

  // Focus states
  focus: {
    ring: 'focus:ring-ring',
    border: 'focus:border-ring',
  },
} as const;

/**
 * Common theme-aware component classes
 */
export const themeClasses = {
  // Cards
  card: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
  cardHover:
    'bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow',

  // Buttons
  button:
    'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2',
  buttonSecondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2',
  buttonGhost:
    'hover:bg-muted hover:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2',

  // Inputs
  input:
    'bg-background border border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring',

  // Text
  heading: 'text-foreground font-semibold',
  subheading: 'text-muted-foreground font-medium',
  body: 'text-foreground',
  muted: 'text-muted-foreground',

  // Layout
  container: 'bg-background text-foreground',
  section: 'bg-card text-card-foreground border border-border',
} as const;

/**
 * Dark mode specific utilities
 */
export const darkModeClasses = {
  // Ensure proper dark mode contrast
  highContrast: 'dark:text-white dark:bg-gray-900',
  mediumContrast: 'dark:text-gray-100 dark:bg-gray-800',
  lowContrast: 'dark:text-gray-300 dark:bg-gray-700',
} as const;

/**
 * Animation utilities for theme transitions
 */
export const themeTransitions = {
  colors: 'transition-colors duration-200 ease-in-out',
  all: 'transition-all duration-200 ease-in-out',
  fast: 'transition-colors duration-150 ease-in-out',
  slow: 'transition-colors duration-300 ease-in-out',
} as const;

/**
 * Utility to create theme-aware component variants
 */
export function createThemeVariant(
  baseClasses: string,
  variants: Record<string, string> = {}
) {
  return (variant?: string) => {
    const variantClasses = variant ? variants[variant] : '';
    return cn(baseClasses, variantClasses);
  };
}

/**
 * Utility to check if a class is theme-aware
 */
export function isThemeAwareClass(className: string): boolean {
  const themeAwarePatterns = [
    /^bg-(background|card|muted|primary|secondary)$/,
    /^text-(foreground|muted-foreground|primary-foreground|secondary-foreground)$/,
    /^border-(border|input|ring)$/,
    /^hover:bg-(background|card|muted|primary|secondary)$/,
    /^focus:(ring|border)-(ring|input|border)$/,
    /^dark:/,
  ];

  return themeAwarePatterns.some((pattern) => pattern.test(className));
}

/**
 * Utility to validate theme class usage
 */
export function validateThemeClasses(classes: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for hardcoded colors
  const hardcodedColors = [
    'bg-white',
    'bg-black',
    'text-white',
    'text-black',
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
    'text-gray-900',
    'text-gray-800',
    'text-gray-700',
    'text-gray-600',
    'border-gray-200',
    'border-gray-300',
    'border-gray-400',
  ];

  hardcodedColors.forEach((color) => {
    if (classes.includes(color)) {
      warnings.push(`Hardcoded color detected: ${color}`);
      suggestions.push(
        `Consider using semantic color tokens instead of ${color}`
      );
    }
  });

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}
