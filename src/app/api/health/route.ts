import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';
import { handleError } from '@/lib/errors';
import { getEnvironmentInfo, getMonitoringConfig } from '@/lib/env-validation';
import fs from 'fs/promises';
import path from 'path';

interface EnvironmentInfo {
  nodeEnv: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  pid: number;
}

type HealthCheckDetails =
  | {
      [key: string]: unknown;
    }
  | {
      uploadDir: string;
      writable: boolean;
    }
  | {
      rss: string;
      heapUsed: string;
      heapTotal: string;
      heapUsagePercent: string;
    }
  | {
      nodeEnv: string;
      nodeVersion: string;
    };

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    filesystem: HealthCheck;
    memory: HealthCheck;
    environment: HealthCheck;
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    processInfo: EnvironmentInfo;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  details?: HealthCheckDetails;
}

export async function GET(_: NextRequest) {
  
  try {
    const monitoringConfig = getMonitoringConfig();
    
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: await checkDatabase(),
        filesystem: await checkFilesystem(),
        memory: checkMemory(),
        environment: checkEnvironment(),
      }
    };

    // Add metrics if enabled
    if (monitoringConfig.metricsEnabled) {
      result.metrics = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        processInfo: getEnvironmentInfo(),
      };
    }

    // Determine overall status
    const checks = Object.values(result.checks);
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');

    if (hasFailures) {
      result.status = 'unhealthy';
    } else if (hasWarnings) {
      result.status = 'degraded';
    }

    const statusCode = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 500;

    const response = NextResponse.json(result, { status: statusCode });
    
    // Add cache headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    const appError = handleError(error);
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: appError.message,
      timestamp: new Date().toISOString(),
    }, { status: appError.statusCode });
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const dbHealth = await checkDatabaseHealth();
    const duration = Date.now() - startTime;
    
    if (dbHealth.status === 'healthy') {
      return {
        status: 'pass',
        message: 'Database connection healthy',
        duration,
        details: dbHealth
      };
    } else {
      return {
        status: 'fail',
        message: 'Database connection failed',
        duration,
        details: dbHealth
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

async function checkFilesystem(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Check if upload directory exists and is writable
    try {
      await fs.access(uploadDir, fs.constants.F_OK | fs.constants.W_OK);
    } catch {
      // Try to create directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // Test write permissions
    const testFile = path.join(uploadDir, '.health-check');
    await fs.writeFile(testFile, 'health-check');
    await fs.unlink(testFile);
    
    return {
      status: 'pass',
      message: 'Filesystem access healthy',
      duration: Date.now() - startTime,
      details: { uploadDir, writable: true }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Filesystem check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const totalMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  // Warn if memory usage is high (over 512MB RSS or 80% heap usage)
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (totalMB > 512 || heapUsagePercent > 80) {
    return {
      status: 'warn',
      message: 'High memory usage detected',
      details: {
        rss: `${totalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsagePercent: `${heapUsagePercent.toFixed(1)}%`
      }
    };
  }
  
  return {
    status: 'pass',
    message: 'Memory usage normal',
    details: {
      rss: `${totalMB}MB`,
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      heapUsagePercent: `${heapUsagePercent.toFixed(1)}%`
    }
  };
}

function checkEnvironment(): HealthCheck {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'EMAIL_FROM'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    return {
      status: 'fail',
      message: `Missing required environment variables: ${missingEnvVars.join(', ')}`
    };
  }
  
  // Check for weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (nextAuthSecret && nextAuthSecret.length < 64) {
      return {
        status: 'warn',
        message: 'NEXTAUTH_SECRET should be longer in production'
      };
    }
  }
  
  return {
    status: 'pass',
    message: 'Environment configuration valid',
    details: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version
    }
  };
}