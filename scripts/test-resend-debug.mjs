#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.production' });

console.log('🔍 Resend Email Debug Test\n');

async function testResendDirectly() {
    console.log('📋 Environment Check:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'SET (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    console.log('');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is not set in environment');
        process.exit(1);
    }

    try {
        // Test 1: Import Resend directly
        console.log('🧪 Test 1: Direct Resend API Test');
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        console.log('✅ Resend client created successfully');

        // Test 2: Send a simple test email
        console.log('\n🧪 Test 2: Sending test email via Resend API');
        const testEmail = {
            from: process.env.EMAIL_FROM || 'noreply@verida.dgmgumruk.com',
            to: ['test@example.com'], // This won't actually send, but will test API
            subject: 'Resend Debug Test',
            html: '<h1>Test Email</h1><p>This is a test email from Resend debug script.</p>',
            text: 'Test Email\n\nThis is a test email from Resend debug script.',
        };

        console.log('📤 Sending email with payload:', {
            from: testEmail.from,
            to: testEmail.to,
            subject: testEmail.subject,
            hasHtml: !!testEmail.html,
            hasText: !!testEmail.text,
        });

        const result = await resend.emails.send(testEmail);
        
        console.log('📥 Resend API Response:', {
            success: !result.error,
            data: result.data,
            error: result.error,
        });

        if (result.error) {
            console.error('❌ Resend API Error:', result.error);
            console.error('   Error details:', {
                message: result.error.message,
                name: result.error.name,
            });
        } else {
            console.log('✅ Email sent successfully!');
            console.log(`   Email ID: ${result.data?.id}`);
        }

    } catch (error) {
        console.error('❌ Error during Resend test:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });
    }
}

async function testEmailService() {
    console.log('\n🧪 Test 3: Email Service Integration Test');
    
    try {
        const { emailService } = await import('../src/lib/email.ts');
        
        console.log(`📧 Email service provider: ${emailService.getProvider()}`);
        
        // Test sending a verification email
        console.log('\n📤 Testing verification email...');
        const result = await emailService.sendVerificationEmail(
            'test@example.com',
            'https://verida.dgmgumruk.com/auth/callback/email?token=test123'
        );
        
        console.log('✅ Verification email test completed');
        console.log('   Result:', result);
        
    } catch (error) {
        console.error('❌ Email service test failed:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });
    }
}

async function runAllTests() {
    await testResendDirectly();
    await testEmailService();
    
    console.log('\n🏁 Debug tests completed!');
    console.log('\nIf you see errors above, check:');
    console.log('1. RESEND_API_KEY is valid and has proper permissions');
    console.log('2. EMAIL_FROM domain is verified in Resend dashboard');
    console.log('3. Resend account is not suspended or rate limited');
    console.log('4. Network connectivity to Resend API');
}

runAllTests().catch(console.error);