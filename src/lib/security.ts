import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

/**
 * CSRF Token Management
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly HEADER_NAME = 'x-csrf-token';
  private static readonly COOKIE_NAME = 'csrf-token';

  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate CSRF token from request
   */
  static async validateToken(request: NextRequest): Promise<boolean> {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Skip CSRF validation for NextAuth API routes
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return true;
    }

    const tokenFromHeader = request.headers.get(this.HEADER_NAME);
    const tokenFromCookie = request.cookies.get(this.COOKIE_NAME)?.value;

    if (!tokenFromHeader || !tokenFromCookie) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(tokenFromHeader, 'hex'),
      Buffer.from(tokenFromCookie, 'hex')
    );
  }

  /**
   * Set CSRF token in response
   */
  static setTokenInResponse(response: NextResponse, token: string): void {
    response.cookies.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  /**
   * Get CSRF token for client-side use
   */
  static getTokenForClient(request: NextRequest): string | null {
    return request.cookies.get(this.COOKIE_NAME)?.value || null;
  }
}

/**
 * Rate Limiting with Redis-like behavior using Map
 */
export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private maxRequests: number,
    private windowMs: number,
    private keyGenerator: (request: NextRequest) => string = (req) =>
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'
  ) {}

  static getInstance(
    name: string,
    maxRequests: number,
    windowMs: number,
    keyGenerator?: (request: NextRequest) => string
  ): RateLimiter {
    if (!this.instances.has(name)) {
      this.instances.set(
        name,
        new RateLimiter(maxRequests, windowMs, keyGenerator)
      );
    }
    return this.instances.get(name)!;
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean up expired entries
    this.cleanup(windowStart);

    const current = this.requests.get(key) || {
      count: 0,
      resetTime: now + this.windowMs,
    };

    if (current.resetTime <= now) {
      // Reset window
      current.count = 1;
      current.resetTime = now + this.windowMs;
    } else if (current.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    } else {
      // Increment counter
      current.count++;
    }

    this.requests.set(key, current);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - current.count),
      resetTime: current.resetTime,
    };
  }

  private cleanup(windowStart: number): void {
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < windowStart) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Input Sanitization Utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use DOMPurify on client side
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '');
  }

  /**
   * Sanitize file names to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255);
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Remove potentially dangerous characters from search queries
   */
  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/[<>'"&]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }
}

/**
 * Security Headers Utility
 */
export class SecurityHeaders {
  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://www.youtube.com",
      "frame-src 'self' https://www.youtube.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  }
}

/**
 * Request validation utilities
 */
export class RequestValidator {
  /**
   * Validate request origin for CSRF protection
   */
  static validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (!origin || !host) {
      return false;
    }

    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // Allow HTTP in development
    ];

    return allowedOrigins.includes(origin);
  }

  /**
   * Validate content type for API requests
   */
  static validateContentType(request: NextRequest): boolean {
    const contentType = request.headers.get('content-type');

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return contentType?.includes('application/json') || false;
    }

    return true;
  }

  /**
   * Check for suspicious patterns in request
   */
  static detectSuspiciousPatterns(request: NextRequest): boolean {
    const url = request.url.toLowerCase();
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/, // XSS attempts
      /union.*select/, // SQL injection
      /javascript:/, // JavaScript protocol
      /data:.*base64/, // Data URLs
      /eval\(/, // Code execution
      /exec\(/, // Command execution
    ];

    const suspiciousUserAgents = [/sqlmap/, /nikto/, /nessus/, /burp/, /nmap/];

    return (
      suspiciousPatterns.some((pattern) => pattern.test(url)) ||
      suspiciousUserAgents.some((pattern) => pattern.test(userAgent))
    );
  }
}

/**
 * File upload security utilities
 */
export class FileUploadSecurity {
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate file upload security
   */
  static validateFile(file: { name: string; size: number; type: string }): {
    valid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
    ];

    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'File extension not allowed' };
    }

    // Check for suspicious file names
    if (this.hasSuspiciousFileName(file.name)) {
      return { valid: false, error: 'Suspicious file name detected' };
    }

    return { valid: true };
  }

  private static hasSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Reserved names
      /\.(exe|bat|cmd|scr|pif|com|pdb)$/i, // Executable files
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(fileName));
  }
}
