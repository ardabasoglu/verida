import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

// Database error logging is handled by Prisma's built-in error handling

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database connection utilities
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to database');
    return true;
  } catch (error) {
    logger.error(
      'Failed to connect to database:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Successfully disconnected from database');
    return true;
  } catch (error) {
    logger.error(
      'Failed to disconnect from database:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

// Database health check
export async function checkDatabaseHealth() {
  // Skip during build phase when DATABASE_URL might not be available
  if (!process.env.DATABASE_URL) {
    return {
      status: 'unhealthy',
      error: 'DATABASE_URL not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error(
      'Database health check failed:',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Transaction wrapper with error handling
export async function withTransaction<T>(
  callback: (
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >
  ) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    logger.error(
      'Transaction failed:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}
