import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test to verify email service configuration
async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');

    try {
        // Import the email service (this will test the module loading)
        const { emailService } = await import('../src/lib/email.ts');

        const provider = emailService.getProvider();
        console.log(`✅ Email service loaded successfully`);
        console.log(`📧 Active provider: ${provider}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

        // Check configuration
        const hasResend = !!process.env.RESEND_API_KEY;
        const hasSmtp = !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER);

        console.log(`\n📋 Configuration Status:`);
        console.log(`   Resend API Key: ${hasResend ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   SMTP Settings: ${hasSmtp ? '✅ Configured' : '❌ Missing'}`);

        if (provider === 'none') {
            console.log('\n⚠️  No email provider configured!');
            console.log('   Run one of these commands:');
            console.log('   - npm run setup:ethereal (for development)');
            console.log('   - npm run setup:resend (for production setup guide)');
        } else {
            console.log(`\n🎉 Email service ready to use with ${provider} provider!`);
        }

    } catch (error) {
        console.error('❌ Error testing email service:', error.message);
        process.exit(1);
    }
}

testEmailService();