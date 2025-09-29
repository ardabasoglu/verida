#!/usr/bin/env tsx

/**
 * Comprehensive Integration Test Script
 * Tests all major components and functionality before deployment
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  duration?: number;
}

class IntegrationTester {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        status: 'PASS',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        status: 'FAIL',
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async testDatabaseConnection(): Promise<void> {
    await this.runTest('Database Connection', async () => {
      await prisma.$connect();
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      if (!result) throw new Error('Database query failed');
    });
  }

  async testDatabaseSchema(): Promise<void> {
    await this.runTest('Database Schema Validation', async () => {
      // Test all required tables exist
      const tables = ['users', 'pages', 'files', 'comments', 'notifications', 'activity_logs'];
      
      for (const table of tables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          );
        ` as any[];
        
        if (!result[0]?.exists) {
          throw new Error(`Table ${table} does not exist`);
        }
      }
    });
  }

  async testEnvironmentVariables(): Promise<void> {
    await this.runTest('Environment Variables', async () => {
      const required = [
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'EMAIL_SERVER_HOST',
        'EMAIL_FROM'
      ];

      for (const envVar of required) {
        if (!process.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }

      // Validate database URL format
      const dbUrl = process.env.DATABASE_URL!;
      if (!dbUrl.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a PostgreSQL connection string');
      }

      // Validate NextAuth URL format
      const nextAuthUrl = process.env.NEXTAUTH_URL!;
      if (!nextAuthUrl.startsWith('http')) {
        throw new Error('NEXTAUTH_URL must be a valid HTTP/HTTPS URL');
      }
    });
  }

  async testHealthEndpoint(): Promise<void> {
    await this.runTest('Health Endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      if (data.status !== 'healthy' && data.status !== 'degraded') {
        throw new Error(`Health check returned unhealthy status: ${data.status}`);
      }
    });
  }

  async testAuthenticationFlow(): Promise<void> {
    await this.runTest('Authentication Flow', async () => {
      // Test signin page accessibility
      const signinResponse = await fetch(`${this.baseUrl}/auth/signin`);
      if (!signinResponse.ok) {
        throw new Error(`Signin page not accessible: ${signinResponse.status}`);
      }

      // Test CSRF token endpoint (expect 401 for unauthenticated requests)
      const csrfResponse = await fetch(`${this.baseUrl}/api/csrf-token`);
      if (csrfResponse.status !== 401 && csrfResponse.status !== 200) {
        throw new Error(`CSRF token endpoint failed: ${csrfResponse.status}`);
      }
    });
  }

  async testAPIEndpoints(): Promise<void> {
    await this.runTest('API Endpoints', async () => {
      const endpoints = [
        '/api/pages',
        '/api/users',
        '/api/notifications',
        '/api/search',
        '/api/tags'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        // Expect 401 (unauthorized) for protected endpoints without auth
        if (response.status !== 401 && response.status !== 200) {
          throw new Error(`Endpoint ${endpoint} returned unexpected status: ${response.status}`);
        }
      }
    });
  }

  async testFileUploadDirectory(): Promise<void> {
    await this.runTest('File Upload Directory', async () => {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      
      try {
        await fs.access(uploadDir);
      } catch {
        // Directory doesn't exist, try to create it
        await fs.mkdir(uploadDir, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(uploadDir, 'test-write.txt');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    });
  }

  async testDatabaseSeed(): Promise<void> {
    await this.runTest('Database Seed Data', async () => {
      // Check if admin user exists
      const adminUser = await prisma.user.findFirst({
        where: { role: 'SYSTEM_ADMIN' }
      });

      if (!adminUser) {
        console.log('⚠️  No admin user found. Consider running: npm run db:seed');
      }

      // Check if sample pages exist
      const pageCount = await prisma.page.count();
      if (pageCount === 0) {
        console.log('⚠️  No pages found. Consider running: npm run db:seed');
      }
    });
  }

  async testSecurityHeaders(): Promise<void> {
    await this.runTest('Security Headers', async () => {
      const response = await fetch(`${this.baseUrl}/`);
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];

      for (const header of requiredHeaders) {
        if (!response.headers.get(header)) {
          throw new Error(`Missing security header: ${header}`);
        }
      }
    });
  }

  async testEmailConfiguration(): Promise<void> {
    await this.runTest('Email Configuration', async () => {
      const emailHost = process.env.EMAIL_SERVER_HOST;
      const emailFrom = process.env.EMAIL_FROM;

      if (!emailHost || !emailFrom) {
        throw new Error('Email configuration incomplete');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailFrom)) {
        throw new Error('EMAIL_FROM is not a valid email address');
      }

      // Check domain restriction
      if (!emailFrom.includes('@dgmgumruk.com')) {
        console.log('⚠️  EMAIL_FROM should use @dgmgumruk.com domain for consistency');
      }
    });
  }

  async testPerformanceIndexes(): Promise<void> {
    await this.runTest('Database Performance Indexes', async () => {
      // Check if performance indexes exist by looking for any indexes on key tables
      const indexQuery = `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('pages', 'users', 'files', 'comments', 'notifications', 'activity_logs')
        AND indexname NOT LIKE '%pkey'
      `;
      
      const indexes = await prisma.$queryRawUnsafe(indexQuery) as any[];
      
      // We expect at least some indexes to exist (Prisma creates some automatically)
      if (indexes.length < 5) {
        console.log(`⚠️  Found ${indexes.length} indexes. Consider adding more performance indexes.`);
      }
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Integration Tests...\n');

    await this.testEnvironmentVariables();
    await this.testDatabaseConnection();
    await this.testDatabaseSchema();
    await this.testDatabaseSeed();
    await this.testPerformanceIndexes();
    await this.testFileUploadDirectory();
    await this.testHealthEndpoint();
    await this.testAuthenticationFlow();
    await this.testAPIEndpoints();
    await this.testSecurityHeaders();
    await this.testEmailConfiguration();

    await this.printResults();
    await this.cleanup();
  }

  private async printResults(): Promise<void> {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Total: ${this.results.length}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Application is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix issues before deployment.');
      process.exit(1);
    }
  }

  private async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

export { IntegrationTester };