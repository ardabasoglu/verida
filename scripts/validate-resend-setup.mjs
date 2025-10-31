#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.production' });

console.log('🔍 Resend Setup Validation\n');

async function validateResendSetup() {
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    console.log('📋 Configuration Check:');
    console.log(`   RESEND_API_KEY: ${apiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   EMAIL_FROM: ${emailFrom ? '✅ Present' : '❌ Missing'}`);
    
    if (apiKey) {
        console.log(`   API Key format: ${apiKey.startsWith('re_') ? '✅ Valid format' : '❌ Invalid format'}`);
        console.log(`   API Key length: ${apiKey.length} characters`);
    }
    
    if (emailFrom) {
        const domain = emailFrom.split('@')[1];
        console.log(`   Email domain: ${domain}`);
        console.log(`   Email format: ${emailFrom.includes('@') ? '✅ Valid format' : '❌ Invalid format'}`);
    }

    if (!apiKey || !emailFrom) {
        console.log('\n❌ Missing required configuration!');
        console.log('Please ensure both RESEND_API_KEY and EMAIL_FROM are set in .env.production');
        return false;
    }

    try {
        console.log('\n🧪 Testing Resend API Connection...');
        const { Resend } = await import('resend');
        const resend = new Resend(apiKey);

        // Test API key validity by trying to get domains
        console.log('📡 Checking API key validity...');
        
        // Try a simple API call to validate the key
        const testResult = await resend.emails.send({
            from: emailFrom,
            to: ['test@resend.dev'], // Resend's test email
            subject: 'API Key Validation Test',
            html: '<p>This is a test to validate the API key.</p>',
        });

        if (testResult.error) {
            console.log('📥 API Response:', testResult.error);
            
            if (testResult.error.message.includes('Invalid API key')) {
                console.log('❌ API Key is invalid');
            } else if (testResult.error.message.includes('domain')) {
                console.log('❌ Domain verification issue');
                console.log('   Make sure your domain is verified in Resend dashboard');
            } else {
                console.log('⚠️  API call failed:', testResult.error.message);
            }
        } else {
            console.log('✅ API Key is valid and working!');
            console.log(`   Test email ID: ${testResult.data?.id}`);
        }

    } catch (error) {
        console.error('❌ Error testing Resend setup:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('   This might be a network connectivity issue');
        }
    }

    console.log('\n📚 Troubleshooting Tips:');
    console.log('1. Verify your API key in Resend dashboard: https://resend.com/api-keys');
    console.log('2. Ensure your domain is verified: https://resend.com/domains');
    console.log('3. Check if your Resend account has sending limits');
    console.log('4. Make sure the EMAIL_FROM address uses a verified domain');
    console.log('5. Check Resend logs for any delivery issues');
}

validateResendSetup().catch(console.error);