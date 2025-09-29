'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  cn,
  themeClasses,
  themeColors,
  themeTransitions,
} from '@/lib/theme-utils';
import { Sun, Moon, Monitor, Palette, CheckCircle } from 'lucide-react';

export function ThemeExample() {
  const { theme, setTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Theme System Demo
        </h1>
        <p className="text-muted-foreground text-lg">
          Demonstrating proper theme-aware component usage
        </p>

        {/* Theme Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
            className="gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
            className="gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            System
          </Button>
        </div>
      </div>

      {/* Current Theme Info */}
      <Card className={themeClasses.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Theme
          </CardTitle>
          <CardDescription>
            The theme system automatically applies appropriate colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              label={theme || 'system'}
              color="accent"
              className="text-sm"
            />
            <div className="text-sm text-muted-foreground">
              All components below automatically adapt to theme changes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Demo */}
      <Card className={themeClasses.card}>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Semantic color tokens that adapt to theme changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div
                className={cn('h-16 rounded-lg border', themeColors.background)}
              />
              <div className="text-sm font-medium">Background</div>
            </div>
            <div className="space-y-2">
              <div className={cn('h-16 rounded-lg border', themeColors.card)} />
              <div className="text-sm font-medium">Card</div>
            </div>
            <div className="space-y-2">
              <div
                className={cn('h-16 rounded-lg border', themeColors.muted)}
              />
              <div className="text-sm font-medium">Muted</div>
            </div>
            <div className="space-y-2">
              <div
                className={cn('h-16 rounded-lg border', themeColors.primary)}
              />
              <div className="text-sm font-medium">Primary</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Components */}
      <Card className={themeClasses.card}>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
          <CardDescription>
            Form elements and buttons with proper theme support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Example */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-input">Demo Input</Label>
              <Input
                id="demo-input"
                placeholder="Type something..."
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInputValue(e.target.value)
                }
                className={cn(themeClasses.input, themeTransitions.colors)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className={cn(themeClasses.button, themeTransitions.colors)}
              >
                Primary Button
              </Button>
              <Button
                variant="secondary"
                className={cn(
                  themeClasses.buttonSecondary,
                  themeTransitions.colors
                )}
              >
                Secondary Button
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  themeClasses.buttonGhost,
                  themeTransitions.colors
                )}
              >
                Ghost Button
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-2">
            <Label>Status Badges</Label>
            <div className="flex gap-2 flex-wrap">
              <Badge label="Default" color="blue" />
              <Badge label="Secondary" color="gray" />
              <Badge label="Outline" color="accent" />
              <Badge label="Destructive" color="red" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className={themeClasses.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Best Practices
          </CardTitle>
          <CardDescription>
            Guidelines for creating theme-aware components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">✅ Do</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use semantic color tokens (bg-card, text-foreground)</li>
                <li>• Apply theme transitions for smooth changes</li>
                <li>• Test in both light and dark modes</li>
                <li>• Use the cn() utility for class merging</li>
                <li>• Leverage themeClasses for consistency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                ❌ Don&apos;t
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use hardcoded colors (bg-white, text-black)</li>
                <li>• Forget to add dark: variants</li>
                <li>• Skip theme transitions</li>
                <li>• Mix semantic and hardcoded colors</li>
                <li>• Ignore accessibility contrast ratios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className={themeClasses.card}>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to properly implement theme-aware components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                ✅ Correct Implementation
              </h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {`// Using semantic tokens
<div className="bg-card text-card-foreground border border-border">
  <h2 className="text-foreground font-semibold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// With theme transitions
<button className="bg-primary text-primary-foreground 
                  hover:bg-primary/90 transition-colors">
  Click me
</button>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">
                ❌ Incorrect Implementation
              </h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {`// Hardcoded colors (won't adapt to theme)
<div className="bg-white text-black border border-gray-200">
  <h2 className="text-gray-900 font-semibold">Title</h2>
  <p className="text-gray-600">Description</p>
</div>

// Missing theme transitions
<button className="bg-blue-500 text-white hover:bg-blue-600">
  Click me
</button>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
