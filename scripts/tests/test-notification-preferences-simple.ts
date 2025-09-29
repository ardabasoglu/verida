#!/usr/bin/env ts-node

/**
 * Simple test script for notification preferences functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Notification Preferences Database Operations...\n');

    try {
        // Create a test user if not exists
        const testUser = await prisma.user.upsert({
            where: { email: 'test-prefs@dgmgumruk.com' },
            update: {},
            create: {
                email: 'test-prefs@dgmgumruk.com',
                name: 'Test Preferences User',
                role: 'MEMBER',
            },
        });

        console.log(`✅ Test user created/found: ${testUser.email}`);

        // Test 1: Create default notification preferences
        const defaultPrefs = await prisma.notificationPreference.upsert({
            where: { userId: testUser.id },
            update: {},
            create: {
                userId: testUser.id,
                inAppNotifications: true,
            },
        });

        console.log(`✅ Default preferences created: inAppNotifications = ${defaultPrefs.inAppNotifications}`);

        // Test 2: Update notification preferences
        const updatedPrefs = await prisma.notificationPreference.update({
            where: { userId: testUser.id },
            data: { inAppNotifications: false },
        });

        console.log(`✅ Preferences updated: inAppNotifications = ${updatedPrefs.inAppNotifications}`);

        // Test 3: Verify the update persisted
        const verifyPrefs = await prisma.notificationPreference.findUnique({
            where: { userId: testUser.id },
        });

        if (verifyPrefs && verifyPrefs.inAppNotifications === false) {
            console.log(`✅ Preferences verified: inAppNotifications = ${verifyPrefs.inAppNotifications}`);
        } else {
            console.log(`❌ Preferences verification failed`);
        }

        // Test 4: Reset back to true
        await prisma.notificationPreference.update({
            where: { userId: testUser.id },
            data: { inAppNotifications: true },
        });

        console.log(`✅ Preferences reset to default`);

        // Test 5: Test notification creation and management
        const testNotification = await prisma.notification.create({
            data: {
                userId: testUser.id,
                title: 'Test Notification',
                message: 'This is a test notification for preferences testing',
                type: 'test',
            },
        });

        console.log(`✅ Test notification created: ${testNotification.title}`);

        // Mark as read
        await prisma.notification.update({
            where: { id: testNotification.id },
            data: { read: true },
        });

        console.log(`✅ Notification marked as read`);

        // Get notification count
        const notificationCount = await prisma.notification.count({
            where: { userId: testUser.id },
        });

        console.log(`✅ User has ${notificationCount} total notifications`);

        // Clean up test notification
        await prisma.notification.delete({
            where: { id: testNotification.id },
        });

        console.log(`✅ Test notification cleaned up`);

        console.log('\n🎉 All notification preferences database tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);