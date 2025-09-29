import { NextRequest, NextResponse } from 'next/server';
import {
  withAuth,
  withAdminAuth,
  withErrorHandling,
  withValidation,
  withRateLimit,
  withCSRFProtection,
  withSecurityValidation,
  withInputSanitization,
  combineMiddleware,
} from '@/lib/api-middleware';
import { MIDDLEWARE_PRESETS, SECURITY_CONFIG } from '@/lib/security-config';
import { z } from 'zod';

/**
 * Security middleware preset types
 */
type SecurityPreset = keyof typeof MIDDLEWARE_PRESETS;

/**
 * Custom security options
 */
interface SecurityOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (request: NextRequest) => string;
  };
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCSRF?: boolean;
  validateInput?: boolean;
  sanitizeInput?: boolean;
  validateFiles?: boolean;
  customValidation?: z.ZodSchema;
}

type Handler = (
  request: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse>;
type Middleware = (handler: Handler) => Handler | Promise<Handler>;

/**
 * Create a secure API handler with specified security measures
 */
export function createSecureApiHandler(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  preset?: SecurityPreset,
  customOptions?: SecurityOptions
) {
  // Get preset configuration
  const presetConfig = preset ? MIDDLEWARE_PRESETS[preset] : {};

  // Merge with custom options
  const options = { ...presetConfig, ...customOptions };

  // Build middleware chain
  const middlewares: Middleware[] = [];

  // Always add error handling first
  middlewares.push(withErrorHandling);

  // Add security validation
  if (options.validateInput !== false) {
    middlewares.push(withSecurityValidation);
  }

  // Add input sanitization
  if (options.sanitizeInput !== false) {
    middlewares.push(withInputSanitization);
  }

  // Add rate limiting
  if (options.rateLimit) {
    middlewares.push(
      withRateLimit(
        options.rateLimit.maxRequests,
        options.rateLimit.windowMs,
        options.rateLimit.keyGenerator
      )
    );
  }

  // Add authentication
  if (options.requireAdmin) {
    middlewares.push(withAdminAuth);
  } else if (options.requireAuth) {
    middlewares.push(withAuth);
  }

  // Add CSRF protection
  if (options.requireCSRF) {
    middlewares.push(withCSRFProtection);
  }

  // Add custom validation
  if (options.customValidation) {
    middlewares.push(withValidation(options.customValidation));
  }

  // Combine all middleware
  return combineMiddleware(...middlewares)(handler);
}

/**
 * Predefined secure API handlers for common use cases
 */
export const secureApiHandlers = {
  /**
   * Standard authenticated API endpoint
   */
  standard: (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) => createSecureApiHandler(handler, 'STANDARD_API'),

  /**
   * Authentication API endpoint
   */
  auth: (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) => createSecureApiHandler(handler, 'AUTH_API'),

  /**
   * File upload API endpoint
   */
  fileUpload: (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) => createSecureApiHandler(handler, 'FILE_UPLOAD_API'),

  /**
   * Admin API endpoint
   */
  admin: (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) => createSecureApiHandler(handler, 'ADMIN_API'),

  /**
   * Public read-only API endpoint
   */
  publicRead: (
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) => createSecureApiHandler(handler, 'PUBLIC_READ_API'),

  /**
   * Custom secure API endpoint
   */
  custom: (
    handler: (
      request: NextRequest,
      ...args: unknown[]
    ) => Promise<NextResponse>,
    options: SecurityOptions
  ) => createSecureApiHandler(handler, undefined, options),
};

/**
 * Rate limiting presets for different endpoint types
 */
export const rateLimitPresets = {
  // Very strict for sensitive operations
  strict: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Moderate for general API usage
  moderate: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Lenient for read operations
  lenient: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // File uploads
  fileUpload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // Search operations
  search: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Create rate limit key generators for different scenarios
 */
export const rateLimitKeyGenerators = {
  /**
   * Rate limit by IP address (default)
   */
  byIp: (request: NextRequest) =>
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown',

  /**
   * Rate limit by user ID (requires authentication)
   */
  byUserId: (request: NextRequest) => {
    // This would need to extract user ID from session
    // Implementation depends on how user ID is available in the request
    return request.headers.get('x-user-id') || 'anonymous';
  },

  /**
   * Rate limit by IP and endpoint combination
   */
  byIpAndEndpoint: (request: NextRequest) => {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const endpoint = request.nextUrl.pathname;
    return `${ip}:${endpoint}`;
  },

  /**
   * Rate limit by user agent (for bot detection)
   */
  byUserAgent: (request: NextRequest) => {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return userAgent.substring(0, 100); // Limit length
  },
};

/**
 * Security event logger
 */
export class SecurityEventLogger {
  static async logSecurityEvent(
    event: string,
    request: NextRequest,
    details?: Record<string, unknown>
  ) {
    if (!SECURITY_CONFIG.MONITORING.LOG_SECURITY_EVENTS) {
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      event,
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      method: request.method,
      ...details,
    };

    // In production, this would send to a proper logging service
    console.warn('Security Event:', JSON.stringify(logData, null, 2));
  }

  static async logRateLimitViolation(request: NextRequest, limit: number) {
    if (!SECURITY_CONFIG.MONITORING.LOG_RATE_LIMIT_VIOLATIONS) {
      return;
    }

    await this.logSecurityEvent('RATE_LIMIT_VIOLATION', request, {
      limit,
      severity: 'medium',
    });
  }

  static async logSuspiciousActivity(request: NextRequest, reason: string) {
    if (!SECURITY_CONFIG.MONITORING.ALERT_ON_SUSPICIOUS_ACTIVITY) {
      return;
    }

    await this.logSecurityEvent('SUSPICIOUS_ACTIVITY', request, {
      reason,
      severity: 'high',
    });
  }

  static async logAuthenticationFailure(request: NextRequest, reason: string) {
    if (!SECURITY_CONFIG.MONITORING.LOG_FAILED_ATTEMPTS) {
      return;
    }

    await this.logSecurityEvent('AUTHENTICATION_FAILURE', request, {
      reason,
      severity: 'medium',
    });
  }
}
