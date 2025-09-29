# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Verida application.

## Overview

The security implementation includes multiple layers of protection:

1. **Input Validation & Sanitization**
2. **CSRF Protection**
3. **Rate Limiting**
4. **Security Headers**
5. **Authentication & Authorization**
6. **File Upload Security**
7. **SQL Injection Prevention**
8. **XSS Protection**

## 1. Input Validation & Sanitization

### Zod Schema Validation

All user inputs are validated using enhanced Zod schemas that check for:

- SQL injection patterns
- XSS attempts
- Path traversal attacks
- Command injection
- Malicious file names

**Location**: `src/lib/validations/security.ts`

**Key Schemas**:
- `secureStringSchema()` - General string validation with security checks
- `secureHtmlSchema` - HTML content validation for rich text editor
- `secureDgmgumrukEmailSchema` - Email validation with domain restriction
- `secureFileNameSchema` - File name validation
- `secureUrlSchema` - URL validation with protocol restrictions

### Usage Example

```typescript
import { secureStringSchema } from '@/lib/validations/security'

const titleSchema = secureStringSchema(200).min(1, 'Title is required')
const validatedTitle = titleSchema.parse(userInput)
```

## 2. CSRF Protection

### Implementation

CSRF protection is implemented using cryptographically secure tokens:

**Server-side**: `src/lib/security.ts` - `CSRFProtection` class
**Client-side**: `src/lib/csrf-client.ts` - Token management utilities

### Features

- 32-byte random tokens
- Timing-safe comparison
- Automatic token rotation
- Cookie-based storage with security flags

### Usage

**Get CSRF Token**:
```typescript
import { secureApi } from '@/lib/csrf-client'

// Automatically includes CSRF token
const response = await secureApi.post('/api/pages', pageData)
```

**API Endpoint**:
```
GET /api/csrf-token - Get CSRF token for authenticated users
```

## 3. Rate Limiting

### Implementation

Advanced rate limiting with multiple strategies:

**Location**: `src/lib/security.ts` - `RateLimiter` class

### Features

- Per-IP rate limiting
- Per-user rate limiting
- Per-endpoint rate limiting
- Configurable windows and limits
- Automatic cleanup of expired entries

### Configuration

**Location**: `src/lib/security-config.ts`

```typescript
RATE_LIMITS: {
  API_GENERAL: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  FILE_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },
  SEARCH: { maxRequests: 50, windowMs: 60 * 1000 },
}
```

### Usage

```typescript
import { withRateLimit } from '@/lib/api-middleware'

export const GET = withRateLimit(50, 60 * 1000)(async (request) => {
  // API handler code
})
```

## 4. Security Headers

### Implementation

Comprehensive security headers are set at multiple levels:

1. **Next.js Configuration** (`next.config.ts`)
2. **Middleware** (`src/middleware.ts`)
3. **API Responses** (`src/lib/security.ts`)

### Headers Included

- `Strict-Transport-Security` - HTTPS enforcement
- `X-Content-Type-Options: nosniff` - MIME type sniffing prevention
- `X-Frame-Options: DENY` - Clickjacking protection
- `X-XSS-Protection` - XSS filtering
- `Content-Security-Policy` - Resource loading restrictions
- `Referrer-Policy` - Referrer information control

### Content Security Policy

```typescript
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "frame-src 'self' https://www.youtube.com",
  "object-src 'none'",
].join('; ')
```

## 5. Authentication & Authorization

### Domain Restriction

Only `@dgmgumruk.com` email addresses are allowed:

```typescript
const emailSchema = z.string()
  .email()
  .refine(email => email.endsWith('@dgmgumruk.com'))
```

### Role-Based Access Control

Four user roles with specific permissions:

- `SYSTEM_ADMIN` - Full system access
- `ADMIN` - User management and content oversight
- `EDITOR` - Content creation and editing
- `MEMBER` - Read-only access with commenting

### Middleware Protection

**Location**: `src/middleware.ts`

- Route-based access control
- Session validation
- Domain restriction enforcement
- Suspicious request detection

## 6. File Upload Security

### Implementation

**Location**: `src/lib/security.ts` - `FileUploadSecurity` class

### Security Measures

1. **File Type Validation**
   - MIME type checking
   - File extension validation
   - Magic number verification (planned)

2. **File Size Limits**
   - Maximum 10MB per file
   - Configurable limits per file type

3. **File Name Security**
   - Path traversal prevention
   - Reserved name blocking
   - Character sanitization

4. **Content Scanning**
   - Malicious pattern detection
   - Executable file blocking

### Allowed File Types

```typescript
ALLOWED_MIME_TYPES: [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
```

## 7. SQL Injection Prevention

### Prisma ORM

All database queries use Prisma ORM with:
- Parameterized queries
- Type-safe operations
- Automatic escaping

### Input Validation

Additional protection through pattern detection:

```typescript
SQL_INJECTION_PATTERNS: [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(--|\/\*|\*\/|;|'|")/,
  /(\bOR\b|\bAND\b).*[=<>]/i,
]
```

## 8. XSS Protection

### Content Sanitization

**Server-side**: Input validation and HTML sanitization
**Client-side**: DOMPurify integration (planned)

### Pattern Detection

```typescript
XSS_PATTERNS: [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
]
```

### Rich Text Editor Security

The TipTap editor includes:
- HTML sanitization
- Allowed tag whitelisting
- Attribute filtering
- Protocol validation for links

## API Security Middleware

### Secure API Handler

**Location**: `src/lib/secure-api.ts`

Provides easy-to-use security presets:

```typescript
import { secureApiHandlers } from '@/lib/secure-api'

// Standard authenticated endpoint
export const POST = secureApiHandlers.standard(async (request) => {
  // Handler code
})

// Admin-only endpoint
export const DELETE = secureApiHandlers.admin(async (request) => {
  // Handler code
})

// File upload endpoint
export const POST = secureApiHandlers.fileUpload(async (request) => {
  // Handler code
})
```

### Middleware Chain

Each secure handler applies:

1. Error handling
2. Security validation
3. Input sanitization
4. Rate limiting
5. Authentication
6. CSRF protection
7. Custom validation

## Security Testing

### Development Testing

**Location**: `src/lib/security-test.ts`

Comprehensive security testing utilities:

```typescript
import { SecurityTester } from '@/lib/security-test'

const tester = new SecurityTester()
await tester.testInputValidation(validationFn, 'Input Validation')
await tester.testRateLimit('/api/pages', 100, 15 * 60 * 1000)
await tester.testCSRFProtection('/api/pages')
```

### Test Endpoint

**Development only**: `GET /api/security-test`

Run security tests against the application:

```bash
curl "http://localhost:3000/api/security-test?type=all"
```

## Configuration

### Security Configuration

**Location**: `src/lib/security-config.ts`

Centralized security settings:

```typescript
export const SECURITY_CONFIG = {
  RATE_LIMITS: { /* rate limiting config */ },
  FILE_UPLOAD: { /* file upload config */ },
  CONTENT: { /* content validation config */ },
  HEADERS: { /* security headers config */ },
  VALIDATION: { /* input validation patterns */ },
}
```

### Environment-Specific Settings

Different security levels for development and production:

```typescript
DEVELOPMENT: {
  ALLOW_HTTP: true,
  LOG_LEVEL: 'debug',
},
PRODUCTION: {
  ENFORCE_HTTPS: true,
  STRICT_TRANSPORT_SECURITY: true,
  LOG_LEVEL: 'error',
}
```

## Monitoring & Logging

### Security Event Logging

**Location**: `src/lib/secure-api.ts` - `SecurityEventLogger`

Logs security events:
- Rate limit violations
- Suspicious activity
- Authentication failures
- CSRF token violations

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "event": "RATE_LIMIT_VIOLATION",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "url": "/api/pages",
  "method": "POST",
  "severity": "medium"
}
```

## Best Practices

### For Developers

1. **Always use secure API handlers** for new endpoints
2. **Validate all inputs** using security schemas
3. **Use the secure API client** for frontend requests
4. **Test security measures** in development
5. **Review security logs** regularly

### For Administrators

1. **Monitor rate limit violations**
2. **Review authentication failures**
3. **Keep security configuration updated**
4. **Run security tests regularly**
5. **Monitor file upload patterns**

## Security Checklist

- [ ] Input validation implemented
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] File upload security active
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Security logging enabled
- [ ] Tests passing
- [ ] Configuration reviewed

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**
   - Ensure client fetches token before requests
   - Check cookie settings
   - Verify token header name

2. **Rate Limit Issues**
   - Check rate limit configuration
   - Verify IP detection
   - Review time windows

3. **File Upload Failures**
   - Verify file type allowlist
   - Check file size limits
   - Review file name validation

### Debug Mode

Enable debug logging in development:

```typescript
DEVELOPMENT: {
  LOG_LEVEL: 'debug',
}
```

## Updates & Maintenance

### Regular Tasks

1. **Update security patterns** as new threats emerge
2. **Review and adjust rate limits** based on usage
3. **Update allowed file types** as needed
4. **Monitor security logs** for new attack patterns
5. **Test security measures** after updates

### Security Updates

When updating security measures:

1. Test in development environment
2. Run security test suite
3. Review configuration changes
4. Update documentation
5. Deploy with monitoring

## Compliance

This implementation addresses security requirements:

- **Requirement 1**: Domain-restricted authentication
- **Requirement 2**: Role-based access control
- **Requirement 9**: Secure file storage and validation

The security measures provide defense against:
- SQL injection attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Path traversal attacks
- File upload vulnerabilities
- Brute force attacks
- Data exfiltration attempts