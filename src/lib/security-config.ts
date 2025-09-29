/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SECURITY_CONFIG = {
  // Rate limiting configurations
  RATE_LIMITS: {
    // General API rate limit
    API_GENERAL: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    // Authentication endpoints
    AUTH: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    // File upload endpoints
    FILE_UPLOAD: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    // Search endpoints
    SEARCH: {
      maxRequests: 50,
      windowMs: 60 * 1000, // 1 minute
    },
    // User management endpoints
    USER_MANAGEMENT: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
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
    ],
    ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  // Content security
  CONTENT: {
    MAX_TITLE_LENGTH: 200,
    MAX_CONTENT_LENGTH: 50000,
    MAX_COMMENT_LENGTH: 1000,
    MAX_TAGS_PER_PAGE: 10,
    MAX_TAG_LENGTH: 50,
    MAX_FILES_PER_PAGE: 5,
  },

  // Search security
  SEARCH: {
    MAX_QUERY_LENGTH: 200,
    MAX_RESULTS_PER_PAGE: 100,
    MAX_TAGS_IN_FILTER: 5,
  },

  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours
    DOMAIN_RESTRICTION: '@dgmgumruk.com',
  },

  // CSRF protection
  CSRF: {
    TOKEN_LENGTH: 32,
    HEADER_NAME: 'x-csrf-token',
    COOKIE_NAME: 'csrf-token',
    COOKIE_MAX_AGE: 60 * 60 * 24, // 24 hours
  },

  // Security headers
  HEADERS: {
    HSTS_MAX_AGE: 63072000, // 2 years
    CSP_DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.youtube.com', 'https://www.google.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'media-src': ["'self'", 'https://www.youtube.com'],
      'frame-src': ["'self'", 'https://www.youtube.com'],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },

  // Input validation patterns
  VALIDATION: {
    // Dangerous patterns to block
    SQL_INJECTION_PATTERNS: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\bOR\b|\bAND\b).*[=<>]/i,
    ],
    XSS_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ],
    PATH_TRAVERSAL_PATTERNS: [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
    ],
    // Allowed characters for different input types
    FILENAME_PATTERN: /^[a-zA-Z0-9._\-\s]+$/,
    SEARCH_QUERY_PATTERN: /^[a-zA-Z0-9\s\-_.@]+$/,
    TAG_PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
  },

  // Monitoring and logging
  MONITORING: {
    LOG_SECURITY_EVENTS: true,
    LOG_FAILED_ATTEMPTS: true,
    LOG_RATE_LIMIT_VIOLATIONS: true,
    ALERT_ON_SUSPICIOUS_ACTIVITY: true,
  },

  // Environment-specific settings
  DEVELOPMENT: {
    ALLOW_HTTP: true,
    DISABLE_CSRF_FOR_TESTING: false,
    LOG_LEVEL: 'debug',
  },

  PRODUCTION: {
    ALLOW_HTTP: false,
    ENFORCE_HTTPS: true,
    STRICT_TRANSPORT_SECURITY: true,
    LOG_LEVEL: 'error',
  },
} as const

/**
 * Get environment-specific security configuration
 */
export function getSecurityConfig() {
  const baseConfig = SECURITY_CONFIG
  const envConfig = process.env.NODE_ENV === 'production' 
    ? SECURITY_CONFIG.PRODUCTION 
    : SECURITY_CONFIG.DEVELOPMENT

  return {
    ...baseConfig,
    ...envConfig,
  }
}

/**
 * Security middleware configuration presets
 */
export const MIDDLEWARE_PRESETS = {
  // Standard API endpoint security
  STANDARD_API: {
    rateLimit: SECURITY_CONFIG.RATE_LIMITS.API_GENERAL,
    requireAuth: true,
    requireCSRF: true,
    validateInput: true,
    sanitizeInput: true,
  },

  // Authentication endpoint security
  AUTH_API: {
    rateLimit: SECURITY_CONFIG.RATE_LIMITS.AUTH,
    requireAuth: false,
    requireCSRF: false,
    validateInput: true,
    sanitizeInput: true,
  },

  // File upload endpoint security
  FILE_UPLOAD_API: {
    rateLimit: SECURITY_CONFIG.RATE_LIMITS.FILE_UPLOAD,
    requireAuth: true,
    requireCSRF: true,
    validateInput: true,
    sanitizeInput: true,
    validateFiles: true,
  },

  // Admin endpoint security
  ADMIN_API: {
    rateLimit: SECURITY_CONFIG.RATE_LIMITS.USER_MANAGEMENT,
    requireAuth: true,
    requireAdmin: true,
    requireCSRF: true,
    validateInput: true,
    sanitizeInput: true,
  },

  // Public read-only endpoint security
  PUBLIC_READ_API: {
    rateLimit: SECURITY_CONFIG.RATE_LIMITS.SEARCH,
    requireAuth: false,
    requireCSRF: false,
    validateInput: true,
    sanitizeInput: true,
  },
} as const