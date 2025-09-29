import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { hasRole, canManageUsers } from '@/lib/auth-utils';
import { handleError, AppError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Middleware to check authentication for API routes
 */
export async function withAuth(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check domain restriction
    if (!session.user.email?.endsWith('@dgmgumruk.com')) {
      return NextResponse.json(
        { error: 'Access denied: Invalid email domain' },
        { status: 403 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Middleware to check admin role for API routes
 */
export async function withAdminAuth(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Middleware to check specific roles for API routes
 */
export function withRoleAuth(requiredRoles: UserRole[]) {
  return function (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]) => {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!hasRole(session.user.role, requiredRoles)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(request, ...args);
    };
  };
}

/**
 * Get current user from session for API routes
 */
export async function getCurrentUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('No authenticated user');
  }

  return session.user;
}

/**
 * Enhanced error handling wrapper for API routes
 */
export function withErrorHandling(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      const appError = handleError(error);

      // Log error for monitoring
      console.error('API Error:', {
        url: request.url,
        method: request.method,
        error: appError.message,
        stack: appError.stack,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: appError.message,
          ...(process.env.NODE_ENV === 'development' && {
            stack: appError.stack,
          }),
        },
        { status: appError.statusCode }
      );
    }
  };
}

/**
 * Request validation middleware
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (
    handler: (
      request: NextRequest,
      validatedData: T,
      ...args: unknown[]
    ) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]) => {
      try {
        let data: unknown;

        if (request.method === 'GET') {
          // Parse query parameters
          const url = new URL(request.url);
          const params: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          data = params;
        } else {
          // Parse JSON body
          try {
            data = await request.json();
          } catch {
            throw new ValidationError('Invalid JSON in request body');
          }
        }

        const validatedData = await schema.parseAsync(data);
        return handler(request, validatedData, ...args);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }));

          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              fieldErrors,
            },
            { status: 400 }
          );
        }

        throw error;
      }
    };
  };
}

/**
 * Enhanced rate limiting middleware with different limits for different endpoints
 */
export function withRateLimit(
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
  keyGenerator?: (request: NextRequest) => string
) {
  return function (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]) => {
      const { RateLimiter } = await import('@/lib/security');

      // Create rate limiter instance
      const rateLimiter = RateLimiter.getInstance(
        `${request.nextUrl.pathname}-${maxRequests}-${windowMs}`,
        maxRequests,
        windowMs,
        keyGenerator
      );

      const result = await rateLimiter.checkLimit(request);

      if (!result.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': result.retryAfter?.toString() || '60',
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            },
          }
        );
      }

      const response = await handler(request, ...args);

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        result.remaining.toString()
      );
      response.headers.set(
        'X-RateLimit-Reset',
        new Date(result.resetTime).toISOString()
      );

      return response;
    };
  };
}

/**
 * Combine multiple middleware functions
 */
type Handler = (
  request: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse>;
type Middleware = (handler: Handler) => Handler | Promise<Handler>;

export function combineMiddleware(...middlewares: Middleware[]) {
  return function (handler: Handler) {
    return middlewares.reduceRight(async (acc, middleware) => {
      const resolvedAcc = await acc;
      return middleware(resolvedAcc);
    }, Promise.resolve(handler));
  };
}

/**
 * Standard API response helper
 */
export function createApiResponse<T>(
  data?: T,
  message?: string,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination,
  });
}

/**
 * Standard error response helper
 */
export function createErrorResponse(
  error: string | AppError,
  statusCode?: number
) {
  const message = typeof error === 'string' ? error : error.message;
  const status =
    statusCode || (typeof error === 'object' ? error.statusCode : 500);

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * CSRF Protection middleware
 */
export function withCSRFProtection(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const { CSRFProtection } = await import('@/lib/security');

    const isValid = await CSRFProtection.validateToken(request);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSRF token validation failed',
        },
        { status: 403 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Security validation middleware
 */
export function withSecurityValidation(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const { RequestValidator, SecurityHeaders } = await import(
      '@/lib/security'
    );

    // Validate origin for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (!RequestValidator.validateOrigin(request)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request origin',
          },
          { status: 403 }
        );
      }
    }

    // Validate content type
    if (!RequestValidator.validateContentType(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content type',
        },
        { status: 400 }
      );
    }

    // Check for suspicious patterns
    if (RequestValidator.detectSuspiciousPatterns(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Suspicious request detected',
        },
        { status: 400 }
      );
    }

    const response = await handler(request, ...args);

    // Add security headers
    return SecurityHeaders.addSecurityHeaders(response);
  };
}

/**
 * Input sanitization middleware
 */
export function withInputSanitization(
  handler: (
    request: NextRequest,
    sanitizedData?: unknown,
    ...args: unknown[]
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const { InputSanitizer } = await import('@/lib/security');

    let sanitizedData: unknown = undefined;

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();

        // Sanitize common fields
        if (typeof body === 'object' && body !== null) {
          const sanitized = { ...body };

          // Sanitize HTML content
          if (typeof sanitized.content === 'string') {
            sanitized.content = InputSanitizer.sanitizeHtml(sanitized.content);
          }

          // Sanitize search queries
          if (typeof sanitized.query === 'string') {
            sanitized.query = InputSanitizer.sanitizeSearchQuery(
              sanitized.query
            );
          }

          // Sanitize email addresses
          if (typeof sanitized.email === 'string') {
            sanitized.email = InputSanitizer.sanitizeEmail(sanitized.email);
          }

          sanitizedData = sanitized;
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in request body',
          },
          { status: 400 }
        );
      }
    }

    return handler(request, sanitizedData, ...args);
  };
}

/**
 * File upload security middleware
 */
export function withFileUploadSecurity(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    // This middleware would be used for file upload endpoints
    // File validation would happen in the actual upload handler
    return handler(request, ...args);
  };
}
