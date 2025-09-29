const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupEtherealEmail() {
  try {
    console.log('Creating Ethereal Email account for testing...');
    
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Ethereal Email account created!');
    console.log('📧 Email:', testAccount.user);
    console.log('🔑 Password:', testAccount.pass);
    console.log('🌐 SMTP Host:', testAccount.smtp.host);
    console.log('🔌 SMTP Port:', testAccount.smtp.port);
    
    // Update .env.local with the credentials
    const envPath = path.join(__dirname, '..', '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace email settings
    envContent = envContent.replace(/EMAIL_SERVER_HOST=.*/g, `EMAIL_SERVER_HOST="${testAccount.smtp.host}"`);
    envContent = envContent.replace(/EMAIL_SERVER_PORT=.*/g, `EMAIL_SERVER_PORT="${testAccount.smtp.port}"`);
    envContent = envContent.replace(/EMAIL_SERVER_USER=.*/g, `EMAIL_SERVER_USER="${testAccount.user}"`);
    envContent = envContent.replace(/EMAIL_SERVER_PASSWORD=.*/g, `EMAIL_SERVER_PASSWORD="${testAccount.pass}"`);
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Updated .env.local with Ethereal Email credentials');
    console.log('\n📋 Important Notes:');
    console.log('1. Ethereal Email is for testing only - emails won\'t be delivered');
    console.log('2. You can view sent emails at: https://ethereal.email/');
    console.log('3. Login with the credentials above to see test emails');
    console.log('\n🚀 You can now test email authentication!');
    
  } catch (error) {
    console.error('❌ Error setting up Ethereal Email:', error);
  }
}

setupEtherealEmail();