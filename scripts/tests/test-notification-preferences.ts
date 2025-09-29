#!/usr/bin/env ts-node

/**
 * Test script for notification preferences functionality
 * 
 * This script tests:
 * 1. Getting notification preferences (creates default if not exists)
 * 2. Updating notification preferences
 * 3. Verifying the updates persist
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

async function testNotificationPreferences(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    // Create a test user if not exists
    const testUser = await prisma.user.upsert({
      where: { email: 'test-preferences@dgmgumruk.com' },
      update: {},
      create: {
        email: 'test-preferences@dgmgumruk.com',
        name: 'Test Preferences User',
        role: 'MEMBER',
      },
    });

    console.log(`Using test user: ${testUser.email} (ID: ${testUser.id})`);

    // Test 1: Get notification preferences (should create default)
    try {
      const { getUserNotificationPreferences } = await import('../../src/lib/notification-utils');
      
      const preferences = await getUserNotificationPreferences(testUser.id);
      
      if (preferences && preferences.inAppNotifications === true) {
        results.push({
          test: 'get_default_preferences',
          status: 'success',
          message: 'Default preferences created and retrieved successfully',
        });
      } else {
        results.push({
          test: 'get_default_preferences',
          status: 'error',
          error: 'Default preferences not created correctly',
        });
      }
    } catch (error) {
      results.push({
        test: 'get_default_preferences',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 2: Update notification preferences
    try {
      const { updateNotificationPreferences } = await import('../../src/lib/notification-utils');
      
      const updatedPreferences = await updateNotificationPreferences(testUser.id, {
        inAppNotifications: false,
      });
      
      if (updatedPreferences && updatedPreferences.inAppNotifications === false) {
        results.push({
          test: 'update_preferences',
          status: 'success',
          message: 'Preferences updated successfully',
        });
      } else {
        results.push({
          test: 'update_preferences',
          status: 'error',
          error: 'Preferences not updated correctly',
        });
      }
    } catch (error) {
      results.push({
        test: 'update_preferences',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: Verify preferences persist
    try {
      const { getUserNotificationPreferences } = await import('../../src/lib/notification-utils');
      
      const verifyPreferences = await getUserNotificationPreferences(testUser.id);
      
      if (verifyPreferences && verifyPreferences.inAppNotifications === false) {
        results.push({
          test: 'verify_persistence',
          status: 'success',
          message: 'Preferences persist correctly',
        });
      } else {
        results.push({
          test: 'verify_persistence',
          status: 'error',
          error: 'Preferences do not persist correctly',
        });
      }
    } catch (error) {
      results.push({
        test: 'verify_persistence',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 4: Reset preferences back to true
    try {
      const { updateNotificationPreferences } = await import('../../src/lib/notification-utils');
      
      await updateNotificationPreferences(testUser.id, {
        inAppNotifications: true,
      });
      
      results.push({
        test: 'reset_preferences',
        status: 'success',
        message: 'Preferences reset successfully',
      });
    } catch (error) {
      results.push({
        test: 'reset_preferences',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

  } catch (error) {
    results.push({
      test: 'setup',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

async function main() {
  console.log('🧪 Testing Notification Preferences Functionality...\n');

  try {
    const results = await testNotificationPreferences();
    
    console.log('📊 Test Results:');
    console.log('================');
    
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result) => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message || result.error}`);
      
      if (result.status === 'success') {
        successCount++;
      } else {
        errorCount++;
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${results.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All notification preferences tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
main().catch(console.error);

export { testNotificationPreferences };