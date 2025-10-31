import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupResend() {
  console.log('🚀 Setting up Resend for production emails...\n');
  
  console.log('📋 Resend Setup Instructions:');
  console.log('1. Sign up at https://resend.com');
  console.log('2. Create an API key in your Resend dashboard');
  console.log('3. Add your domain and verify it');
  console.log('4. Update your production environment with the API key\n');
  
  console.log('🔧 Environment Configuration:');
  console.log('For production (.env.production):');
  console.log('RESEND_API_KEY="re_your_api_key_here"');
  console.log('EMAIL_FROM="noreply@yourdomain.com"  # Use your verified domain\n');
  
  console.log('For development (.env.local):');
  console.log('# Keep using Ethereal Email for development');
  console.log('EMAIL_SERVER_HOST="smtp.ethereal.email"');
  console.log('EMAIL_SERVER_PORT="587"');
  console.log('EMAIL_SERVER_USER="your_ethereal_user"');
  console.log('EMAIL_SERVER_PASSWORD="your_ethereal_password"');
  console.log('EMAIL_FROM="noreply@dgmgumruk.com"\n');
  
  console.log('📧 Email Service Features:');
  console.log('✅ Automatic provider switching based on NODE_ENV');
  console.log('✅ Resend for production (reliable delivery)');
  console.log('✅ Ethereal Email for development (testing)');
  console.log('✅ Custom verification email templates');
  console.log('✅ Welcome email for new users');
  console.log('✅ Error handling and logging\n');
  
  console.log('🧪 Testing:');
  console.log('- Development: Emails appear in Ethereal Email inbox');
  console.log('- Production: Emails sent via Resend to real recipients');
  console.log('- Use the email service directly: import { emailService } from "@/lib/email"\n');
  
  console.log('🔍 Verification:');
  console.log('Check your email service status with:');
  console.log('console.log("Email provider:", emailService.getProvider())\n');
  
  // Check current configuration
  const envProdPath = path.join(__dirname, '..', '.env.production');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envProdPath)) {
    const prodContent = fs.readFileSync(envProdPath, 'utf8');
    if (prodContent.includes('RESEND_API_KEY=')) {
      console.log('✅ Resend API key found in .env.production');
    } else {
      console.log('⚠️  Resend API key not found in .env.production');
    }
  }
  
  if (fs.existsSync(envLocalPath)) {
    const localContent = fs.readFileSync(envLocalPath, 'utf8');
    if (localContent.includes('EMAIL_SERVER_HOST=')) {
      console.log('✅ SMTP configuration found in .env.local');
    } else {
      console.log('⚠️  SMTP configuration not found in .env.local');
      console.log('   Run: npm run setup:ethereal to configure development email');
    }
  }
  
  console.log('\n🎉 Resend setup complete! Your app will now use:');
  console.log('   - Resend in production (NODE_ENV=production)');
  console.log('   - Ethereal Email in development (NODE_ENV=development)');
}

setupResend();