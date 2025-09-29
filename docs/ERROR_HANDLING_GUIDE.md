# Error Handling and User Feedback Guide

This guide covers the comprehensive error handling and user feedback system implemented in the Verida application.

## Overview

The error handling system provides:
- Consistent error handling across the application
- User-friendly error messages and validation feedback
- Loading states and success notifications
- Comprehensive error boundaries for React components
- Enhanced API error handling with proper HTTP status codes
- Form validation with real-time feedback

## Components

### 1. Toast Notification System

Located in `src/components/ui/toast.tsx`

#### Usage

```tsx
import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('İşlem Başarılı', 'Veriler başarıyla kaydedildi');
  };

  const handleError = () => {
    toast.error('Hata Oluştu', 'Bir şeyler yanlış gitti');
  };

  const handleWarning = () => {
    toast.warning('Uyarı', 'Bu işlem geri alınamaz');
  };

  const handleInfo = () => {
    toast.info('Bilgi', 'Yeni özellik kullanıma sunuldu');
  };
}
```

#### Features
- Auto-dismiss with configurable duration
- Different types: success, error, warning, info
- Action buttons for interactive notifications
- Responsive design with animations

### 2. Loading Components

Located in `src/components/ui/loading.tsx`

#### LoadingSpinner
```tsx
import { LoadingSpinner } from '@/components/ui/loading';

<LoadingSpinner size="lg" />
```

#### LoadingButton
```tsx
import { LoadingButton } from '@/components/ui/loading';

<LoadingButton 
  isLoading={isSubmitting}
  loadingText="Kaydediliyor..."
  onClick={handleSubmit}
>
  Kaydet
</LoadingButton>
```

#### LoadingOverlay
```tsx
import { LoadingOverlay } from '@/components/ui/loading';

<LoadingOverlay isLoading={isLoading} message="Veriler yükleniyor...">
  <YourContent />
</LoadingOverlay>
```

### 3. Error Boundary

Located in `src/components/ui/error-boundary.tsx`

#### Usage
```tsx
import { ErrorBoundary, withErrorBoundary } from '@/components/ui/error-boundary';

// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent);
```

#### ErrorDisplay Component
```tsx
import { ErrorDisplay } from '@/components/ui/error-boundary';

<ErrorDisplay 
  error="Bir hata oluştu" 
  onRetry={() => refetch()}
/>
```

### 4. Form Validation

Located in `src/components/ui/form-field.tsx`

#### FormField Component
```tsx
import { FormField, Input } from '@/components/ui/form-field';

<FormField
  label="E-posta"
  required
  error={errors.email}
  description="Kurumsal e-posta adresinizi girin"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
  />
</FormField>
```

#### Form Validation Hook
```tsx
import { useFormValidation } from '@/components/ui/form-field';
import { createUserSchema } from '@/lib/validations';

function MyForm() {
  const { errors, validate, validateField, clearErrors } = useFormValidation(createUserSchema);
  
  const handleSubmit = async (data) => {
    const isValid = await validate(data);
    if (!isValid) return;
    
    // Submit form
  };
}
```

## API Error Handling

### Enhanced API Client

Located in `src/lib/api-client.ts`

#### Basic Usage
```tsx
import { apiClient, useApiMutation } from '@/lib/api-client';

// Direct usage
try {
  const response = await apiClient.post('/pages', pageData);
  console.log(response.data);
} catch (error) {
  console.error(error.message);
}

// Hook usage
function MyComponent() {
  const { loading, error, execute } = useApiMutation({
    successMessage: 'Sayfa oluşturuldu',
  });

  const createPage = async () => {
    const result = await execute(() => apiClient.post('/pages', pageData));
    if (result) {
      // Handle success
    }
  };
}
```

### API Middleware

Located in `src/lib/api-middleware.ts`

#### Enhanced Error Handling
```tsx
import { withErrorHandling, withValidation, combineMiddleware } from '@/lib/api-middleware';
import { createPageSchema } from '@/lib/validations';

export const POST = combineMiddleware(
  withErrorHandling,
  withAuth,
  withValidation(createPageSchema),
  withRateLimit(100, 15 * 60 * 1000)
)(async (request, validatedData) => {
  // Your handler logic
  return createApiResponse(result);
});
```

## Error Types

### Custom Error Classes

Located in `src/lib/errors.ts`

```tsx
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError 
} from '@/lib/errors';

// Throw specific errors
throw new ValidationError('Geçersiz e-posta formatı');
throw new AuthenticationError('Giriş gerekli');
throw new AuthorizationError('Yetkisiz erişim');
throw new NotFoundError('Sayfa bulunamadı');
```

## Best Practices

### 1. Error Messages

- Use Turkish language for user-facing messages
- Be specific but not technical
- Provide actionable guidance when possible
- Use consistent terminology

#### Good Examples
```tsx
// Good
"E-posta adresi geçersiz. Lütfen geçerli bir e-posta adresi girin."
"Dosya boyutu 10MB'dan büyük olamaz."
"Bu işlem için yönetici yetkisi gereklidir."

// Bad
"Invalid email format"
"File too large"
"Unauthorized"
```

### 2. Loading States

- Show loading indicators for operations > 200ms
- Use skeleton screens for content loading
- Disable interactive elements during loading
- Provide progress indicators for long operations

### 3. Form Validation

- Validate on blur for better UX
- Show field-level errors immediately
- Clear errors when user starts correcting
- Validate entire form on submit

### 4. Error Recovery

- Always provide retry mechanisms
- Offer alternative actions when possible
- Save user input when errors occur
- Guide users to resolution

## Implementation Examples

### Complete Form with Error Handling

See `src/components/examples/enhanced-page-form.tsx` for a comprehensive example that demonstrates:

- Form validation with real-time feedback
- API error handling with user-friendly messages
- Loading states during submission
- File upload with progress and error handling
- Success notifications and navigation

### API Route with Enhanced Error Handling

```tsx
import { 
  withErrorHandling, 
  withAuth, 
  withValidation,
  createApiResponse,
  createErrorResponse 
} from '@/lib/api-middleware';

export const POST = withErrorHandling(
  withAuth(
    withValidation(createPageSchema)(
      async (request, validatedData) => {
        try {
          const result = await createPage(validatedData);
          return createApiResponse(result, 'Sayfa başarıyla oluşturuldu');
        } catch (error) {
          throw handleError(error);
        }
      }
    )
  )
);
```

## Testing Error Handling

### Unit Tests

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/components/ui/toast';

test('shows error message on failed submission', async () => {
  // Mock API failure
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
  
  render(<MyForm />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});
```

### Integration Tests

```tsx
test('handles validation errors correctly', async () => {
  render(<MyForm />);
  
  // Submit empty form
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(screen.getByText('Bu alan gereklidir')).toBeInTheDocument();
  });
});
```

## Monitoring and Logging

### Error Logging

All errors are automatically logged with context:

```tsx
console.error('API Error:', {
  url: request.url,
  method: request.method,
  error: appError.message,
  stack: appError.stack,
  timestamp: new Date().toISOString(),
});
```

### User Feedback Collection

Consider implementing error reporting:

```tsx
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Send to error reporting service
  errorReportingService.captureException(error, {
    extra: errorInfo,
    user: session?.user,
  });
};
```

## Accessibility

### Screen Reader Support

- Use proper ARIA labels for error messages
- Associate error messages with form fields
- Announce dynamic error messages

```tsx
<input
  aria-describedby={error ? 'email-error' : undefined}
  aria-invalid={!!error}
/>
{error && (
  <div id="email-error" role="alert" className="text-red-600">
    {error}
  </div>
)}
```

### Keyboard Navigation

- Ensure error dialogs are keyboard accessible
- Focus management for error states
- Proper tab order in error scenarios

## Performance Considerations

### Error Boundary Optimization

- Use error boundaries at appropriate component levels
- Avoid wrapping every component individually
- Consider lazy loading for error fallback components

### Toast Performance

- Limit number of simultaneous toasts
- Auto-dismiss to prevent accumulation
- Use React.memo for toast components

### API Error Caching

- Cache validation errors to avoid repeated requests
- Implement retry logic with exponential backoff
- Use proper HTTP status codes for caching

## Conclusion

This comprehensive error handling system provides:

1. **Consistent User Experience**: All errors are handled uniformly
2. **Developer Productivity**: Reusable components and hooks
3. **Maintainability**: Centralized error handling logic
4. **Accessibility**: Screen reader and keyboard support
5. **Performance**: Optimized for production use

Follow these patterns and guidelines to ensure robust error handling throughout the application.