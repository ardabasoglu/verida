/**
 * Environment Variable Validation
 * Validates and provides type-safe access to environment variables
 */

import { z, ZodIssue } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Node.js Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // NextAuth Configuration
  NEXTAUTH_URL: z.string().min(1, 'NEXTAUTH_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Email Configuration
  EMAIL_SERVER_HOST: z.string().min(1, 'EMAIL_SERVER_HOST is required'),
  EMAIL_SERVER_PORT: z.string().regex(/^\d+$/, 'EMAIL_SERVER_PORT must be a number').default('587'),
  EMAIL_SERVER_USER: z.string().min(1).optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  // File Upload Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().regex(/^\d+$/, 'MAX_FILE_SIZE_MB must be a number').default('10'),

  // Security Configuration
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be at least 16 characters').optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),

  // Performance Configuration
  DATABASE_POOL_SIZE: z.string().regex(/^\d+$/, 'DATABASE_POOL_SIZE must be a number').default('10'),
  DATABASE_TIMEOUT: z.string().regex(/^\d+$/, 'DATABASE_TIMEOUT must be a number').default('30000'),

  // Monitoring Configuration
  HEALTH_CHECK_ENABLED: z.string().default('true').transform(val => val === 'true'),
  METRICS_ENABLED: z.string().default('false').transform(val => val === 'true'),
});

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      // Ensure secure configuration in production
      if (env.NEXTAUTH_SECRET.length < 64) {
        console.warn('⚠️  NEXTAUTH_SECRET should be at least 64 characters in production');
      }

      if (!env.DATABASE_URL.includes('ssl=true') && !env.DATABASE_URL.includes('sslmode=require')) {
        console.warn('⚠️  Consider enabling SSL for database connection in production');
      }

      if (!env.EMAIL_FROM.includes('@dgmgumruk.com')) {
        console.warn('⚠️  EMAIL_FROM should use @dgmgumruk.com domain');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err: ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // Don't exit in development, just log the error
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing in development mode despite validation errors');
        // Return a minimal valid environment for development
        return {
          NODE_ENV: 'development',
          DATABASE_URL: process.env.DATABASE_URL || '',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret',
          EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || 'localhost',
          EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || '587',
          EMAIL_FROM: process.env.EMAIL_FROM || 'test@dgmgumruk.com',
          UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
          MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB || '10',
          LOG_LEVEL: 'info',
          DATABASE_POOL_SIZE: '10',
          DATABASE_TIMEOUT: '30000',
          HEALTH_CHECK_ENABLED: true,
          METRICS_ENABLED: false,
        } as z.infer<typeof envSchema>;
      }
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';



// Monitoring configuration helpers
export const getMonitoringConfig = () => ({
  healthCheckEnabled: env.HEALTH_CHECK_ENABLED,
  metricsEnabled: env.METRICS_ENABLED,
});

// Validation helper for runtime checks
export const validateEmailDomain = (email: string): boolean => {
  return email.endsWith('@dgmgumruk.com');
};

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  nodeEnv: env.NODE_ENV,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  pid: process.pid,
});

// Export for use in other modules
export default env;