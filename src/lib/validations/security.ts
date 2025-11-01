import { z } from 'zod';

/**
 * Enhanced security validation schemas
 */

// Common security patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(--|\/\*|\*\/|;|'|")/,
  /(\bOR\b|\bAND\b).*[=<>]/i,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e%5c/i,
];

/**
 * Secure string validation that checks for common attack patterns
 */
export const secureStringSchema = (maxLength = 1000) =>
  z
    .string()
    .max(maxLength, `Text must be less than ${maxLength} characters`)
    .refine(
      (value) => !SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value)),
      { message: 'Input contains potentially dangerous SQL patterns' }
    )
    .refine((value) => !XSS_PATTERNS.some((pattern) => pattern.test(value)), {
      message: 'Input contains potentially dangerous script content',
    })
    .refine(
      (value) =>
        !PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(value)),
      { message: 'Input contains path traversal patterns' }
    );

/**
 * Secure HTML content validation for rich text editor
 */
export const secureHtmlSchema = z
  .string()
  .max(50000, 'Content is too long')
  .refine(
    (value) => {
      // Allow basic HTML tags but block dangerous ones
      // Exception: Allow iframe tags for YouTube videos
      const dangerousTags =
        /<(script|object|embed|form|input|meta|link|style)\b/gi;
      return !dangerousTags.test(value);
    },
    { message: 'Content contains dangerous HTML tags' }
  )
  .refine(
    (value) => {
      // Check iframe tags - only allow YouTube iframes
      const iframeMatches = value.match(/<iframe[^>]*>/gi);
      if (iframeMatches) {
        return iframeMatches.every(iframe => {
          // Check if iframe src is from YouTube
          const srcMatch = iframe.match(/src\s*=\s*["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            return src.startsWith('https://www.youtube.com/embed/');
          }
          return false;
        });
      }
      return true;
    },
    { message: 'Only YouTube iframe embeds are allowed' }
  )
  .refine(
    (value) => {
      // Block javascript: and data: protocols
      const dangerousProtocols = /(javascript|data|vbscript):/gi;
      return !dangerousProtocols.test(value);
    },
    { message: 'Content contains dangerous protocols' }
  );

/**
 * Secure file name validation
 */
export const secureFileNameSchema = z
  .string()
  .min(1, 'File name is required')
  .max(255, 'File name is too long')
  .refine(
    (value) => {
      // Check for valid file name characters
      const validPattern = /^[a-zA-Z0-9._\-\s]+$/;
      return validPattern.test(value);
    },
    { message: 'File name contains invalid characters' }
  )
  .refine(
    (value) => !PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(value)),
    { message: 'File name contains path traversal patterns' }
  )
  .refine(
    (value) => {
      // Block reserved Windows file names
      const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
      const fileName = value.split('.')[0];
      return fileName ? !reservedNames.test(fileName) : true;
    },
    { message: 'File name uses reserved system name' }
  );

/**
 * Secure URL validation
 */
export const secureUrlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (value) => {
      // Only allow HTTP and HTTPS protocols
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    },
    { message: 'Only HTTP and HTTPS URLs are allowed' }
  )
  .refine(
    (value) => {
      // Block localhost and private IP ranges in production
      if (process.env.NODE_ENV === 'production') {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();

        const blockedPatterns = [
          /^localhost$/,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[01])\./,
          /^192\.168\./,
          /^169\.254\./,
          /^::1$/,
          /^fc00:/,
          /^fe80:/,
        ];

        return !blockedPatterns.some((pattern) => pattern.test(hostname));
      }
      return true;
    },
    { message: 'Private network URLs are not allowed' }
  );

/**
 * YouTube URL validation with security checks
 */
export const secureYouTubeUrlSchema = z
  .string()
  .refine(
    (value) => {
      const youtubePattern =
        /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
      return youtubePattern.test(value);
    },
    { message: 'Invalid YouTube URL format' }
  )
  .refine(
    (value) => {
      // Ensure it's HTTPS only
      return value.startsWith('https://');
    },
    { message: 'YouTube URLs must use HTTPS' }
  );

/**
 * Secure email validation with domain restriction
 */
export const secureDgmgumrukEmailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .refine((email) => email.endsWith('@dgmgumruk.com'), {
    message: 'Only @dgmgumruk.com email addresses are allowed',
  })
  .refine(
    (email) => {
      // Additional email security checks
      const localPart = email.split('@')[0];

      if (!localPart) return true;

      // Check for suspicious patterns in local part
      const suspiciousPatterns = [
        /\+.*script/i,
        /\+.*admin/i,
        /\+.*test/i,
        /\.{2,}/,
        /^\.|\.$/, // starts or ends with dot
      ];

      return !suspiciousPatterns.some((pattern) => pattern.test(localPart));
    },
    { message: 'Email address contains suspicious patterns' }
  );

/**
 * Secure search query validation
 */
export const secureSearchQuerySchema = z
  .string()
  .max(200, 'Search query is too long')
  .refine(
    (value) => !SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value)),
    { message: 'Search query contains invalid patterns' }
  )
  .refine(
    (value) => {
      // Limit special characters in search
      const allowedPattern = /^[a-zA-Z0-9\s\-_.@]+$/;
      return allowedPattern.test(value);
    },
    { message: 'Search query contains invalid characters' }
  );

/**
 * Secure pagination parameters
 */
export const securePaginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number too large')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
});

/**
 * Secure ID validation (CUID format)
 */
export const secureIdSchema = z
  .string()
  .cuid('Invalid ID format')
  .refine(
    (value) => {
      // Additional CUID validation
      const cuidPattern = /^c[a-z0-9]{24}$/;
      return cuidPattern.test(value);
    },
    { message: 'ID format is invalid' }
  );

/**
 * Rate limiting key validation
 */
export const rateLimitKeySchema = z
  .string()
  .min(1, 'Rate limit key is required')
  .max(100, 'Rate limit key is too long')
  .refine(
    (value) => {
      // Only allow alphanumeric, dots, and hyphens
      const validPattern = /^[a-zA-Z0-9.\-_]+$/;
      return validPattern.test(value);
    },
    { message: 'Rate limit key contains invalid characters' }
  );

/**
 * CSRF token validation
 */
export const csrfTokenSchema = z
  .string()
  .length(64, 'CSRF token must be exactly 64 characters')
  .refine(
    (value) => {
      // Ensure it's a valid hex string
      const hexPattern = /^[a-f0-9]+$/i;
      return hexPattern.test(value);
    },
    { message: 'CSRF token must be a valid hexadecimal string' }
  );

/**
 * File upload validation schema
 */
export const secureFileUploadSchema = z.object({
  filename: secureFileNameSchema,
  size: z
    .number()
    .int('File size must be an integer')
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  mimeType: z.string().refine(
    (value) => {
      const allowedTypes = [
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
      return allowedTypes.includes(value);
    },
    { message: 'File type is not allowed' }
  ),
});

/**
 * API request headers validation
 */
export const secureHeadersSchema = z.object({
  'content-type': z.string().optional(),
  'user-agent': z.string().max(500, 'User agent string is too long').optional(),
  'x-csrf-token': csrfTokenSchema.optional(),
  authorization: z
    .string()
    .max(1000, 'Authorization header is too long')
    .optional(),
});

// Export all schemas
export { SQL_INJECTION_PATTERNS, XSS_PATTERNS, PATH_TRAVERSAL_PATTERNS };
