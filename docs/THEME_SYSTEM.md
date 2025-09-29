# Theme System Documentation

## Overview

This document explains how to properly implement and use the theme system in our Next.js application. The theme system supports light, dark, and system themes with automatic switching and smooth transitions.

## Architecture

### Core Components

1. **next-themes** - Industry-standard theme provider
2. **Tailwind CSS** - Utility-first CSS with dark mode support
3. **CSS Variables** - Semantic color tokens
4. **Theme Utils** - Helper functions and utilities

### File Structure

```
src/
├── components/
│   ├── providers/
│   │   └── theme-provider.tsx     # Theme provider wrapper
│   ├── ui/
│   │   └── theme-toggle.tsx       # Theme switching component
│   └── examples/
│       └── theme-example.tsx      # Demo component
├── lib/
│   └── theme-utils.ts             # Theme utilities
├── app/
│   ├── globals.css                # CSS variables and base styles
│   └── test-theme/
│       └── page.tsx               # Theme demo page
└── tailwind.config.ts             # Tailwind configuration
```

## Configuration

### 1. Tailwind Configuration

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: ['class'], // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Semantic color tokens using CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        // ... more colors
      },
    },
  },
};
```

### 2. CSS Variables

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  /* ... light theme colors */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  /* ... dark theme colors */
}
```

### 3. Theme Provider

```tsx
// layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

## Usage Guidelines

### 1. Semantic Color Tokens

Always use semantic color tokens instead of hardcoded colors:

```tsx
// ✅ Correct
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Incorrect
<div className="bg-white text-black border border-gray-200">
  <h2 className="text-gray-900">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

### 2. Theme Transitions

Add smooth transitions for theme changes:

```tsx
// ✅ With transitions
<button className="bg-primary text-primary-foreground
                  hover:bg-primary/90 transition-colors">
  Click me
</button>

// ❌ Without transitions
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click me
</button>
```

### 3. Using Theme Utils

```tsx
import { cn, themeClasses, themeColors } from '@/lib/theme-utils';

// Merge classes properly
<div className={cn('base-class', themeClasses.card, 'additional-class')}>

// Use predefined theme classes
<Card className={themeClasses.cardHover}>

// Use semantic colors
<div className={themeColors.background}>
```

### 4. Theme Toggle Component

```tsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </Button>
  );
}
```

## Color Palette

### Background Colors

- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `bg-muted` - Muted/section backgrounds
- `bg-primary` - Primary accent
- `bg-secondary` - Secondary accent

### Text Colors

- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-primary-foreground` - Text on primary
- `text-secondary-foreground` - Text on secondary

### Border Colors

- `border-border` - Default borders
- `border-input` - Input borders
- `ring-ring` - Focus rings

## Common Patterns

### 1. Card Components

```tsx
<Card className="bg-card text-card-foreground border border-border rounded-lg shadow-sm">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-foreground">Content</p>
  </CardContent>
</Card>
```

### 2. Form Elements

```tsx
<div className="space-y-2">
  <Label htmlFor="input" className="text-foreground">
    Label
  </Label>
  <Input
    id="input"
    className="bg-background border border-input text-foreground 
             placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
  />
</div>
```

### 3. Buttons

```tsx
<Button
  className="bg-primary text-primary-foreground 
                  hover:bg-primary/90 focus:ring-2 focus:ring-ring 
                  transition-colors"
>
  Primary Button
</Button>
```

### 4. Navigation

```tsx
<nav className="bg-background border-b border-border">
  <div className="flex items-center space-x-4">
    <Link className="text-foreground hover:text-muted-foreground transition-colors">
      Home
    </Link>
  </div>
</nav>
```

## Testing

### 1. Manual Testing

1. Visit `/test-theme` to see the theme demo
2. Toggle between light, dark, and system themes
3. Verify all components update correctly
4. Check for smooth transitions

### 2. Automated Testing

```tsx
// Test theme switching
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/ui/theme-toggle';

test('theme toggle works correctly', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

  const toggle = screen.getByRole('button');
  fireEvent.click(toggle);

  // Assert theme change
});
```

## Troubleshooting

### Common Issues

1. **Components not updating on theme change**
   - Check if you're using hardcoded colors
   - Verify CSS variables are properly defined
   - Ensure components are wrapped in ThemeProvider

2. **Hydration mismatches**
   - Use `useEffect` to check if component is mounted
   - Provide fallback values for SSR

3. **Smooth transitions not working**
   - Add `transition-colors` class
   - Check if `disableTransitionOnChange` is false

### Debug Tools

1. **Browser DevTools**
   - Inspect element to see applied classes
   - Check CSS variables in computed styles
   - Verify dark class is applied to html element

2. **Theme Validation**

   ```tsx
   import { validateThemeClasses } from '@/lib/theme-utils';

   const validation = validateThemeClasses('bg-white text-black');
   console.log(validation.warnings); // Shows hardcoded colors
   ```

## Migration Guide

### From Hardcoded Colors

1. Replace `bg-white` with `bg-card`
2. Replace `text-gray-900` with `text-foreground`
3. Replace `border-gray-200` with `border-border`
4. Add theme transitions where appropriate

### From Custom Theme Provider

1. Install `next-themes`
2. Replace custom provider with next-themes
3. Update theme toggle component
4. Test all theme switching functionality

## Performance Considerations

1. **CSS Variables** - More performant than JavaScript-based theming
2. **Class-based Dark Mode** - Better than media query approach
3. **Minimal Re-renders** - next-themes optimizes for performance
4. **Smooth Transitions** - Use CSS transitions, not JavaScript

## Accessibility

1. **Color Contrast** - Ensure proper contrast ratios in both themes
2. **Focus Indicators** - Use `ring-ring` for consistent focus styles
3. **Reduced Motion** - Respect user's motion preferences
4. **Screen Readers** - Provide proper ARIA labels for theme controls

## Best Practices

1. **Consistency** - Use the same color tokens throughout the app
2. **Semantic Naming** - Choose meaningful color names
3. **Testing** - Test in both light and dark modes
4. **Documentation** - Document custom color usage
5. **Performance** - Minimize theme-related re-renders
6. **Accessibility** - Ensure proper contrast and focus states

## Future Enhancements

1. **Custom Themes** - Support for brand-specific themes
2. **Theme Persistence** - Better storage and sync options
3. **Animation Controls** - More granular transition controls
4. **Color Picker** - User-customizable color schemes
5. **Theme Validation** - Automated theme compliance checking
