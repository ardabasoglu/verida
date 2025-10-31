# Email Setup Guide

This guide explains how to configure email services for the Verida application, supporting both development and production environments.

## Overview

The application uses a dual email provider system:
- **Development**: Ethereal Email (for testing, emails don't get delivered)
- **Production**: Resend (for reliable email delivery)

## Quick Setup

### Development Environment

1. Run the setup script:
   ```bash
   npm run setup:ethereal
   ```

2. This will:
   - Create a new Ethereal Email test account
   - Update your `.env.local` file with SMTP credentials
   - Provide a preview URL to view sent emails

### Production Environment

1. Sign up for Resend at [https://resend.com](https://resend.com)

2. Create an API key in your Resend dashboard

3. Add your domain and verify it in Resend

4. Update your `.env.production` file:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

5. Run the setup guide:
   ```bash
   npm run setup:resend
   ```

## Environment Variables

### Development (.env.local)
```env
# Ethereal Email (SMTP)
EMAIL_SERVER_HOST="smtp.ethereal.email"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your_ethereal_user"
EMAIL_SERVER_PASSWORD="your_ethereal_password"
EMAIL_FROM="noreply@dgmgumruk.com"
```

### Production (.env.production)
```env
# Resend
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.com"

# Optional: Keep SMTP as fallback
EMAIL_SERVER_HOST="smtp.ethereal.email"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="fallback_user"
EMAIL_SERVER_PASSWORD="fallback_password"
```

## Email Service Features

### Automatic Provider Selection
The email service automatically chooses the appropriate provider:
- Production (`NODE_ENV=production`) + Resend API key → Uses Resend
- Development or missing Resend key → Uses SMTP/Ethereal Email

### Available Email Types

1. **Verification Emails**: Sent during authentication
2. **Welcome Emails**: Sent to new users
3. **Custom Emails**: For notifications and other purposes

### Email Templates

All emails use responsive HTML templates with:
- Professional branding
- Mobile-friendly design
- Fallback text versions
- Consistent styling

## Testing

### Admin Email Test Page
Visit `/admin/email-test` (admin access required) to:
- Check email service status
- Send test emails
- Verify configuration

### API Endpoint
Test programmatically via `/api/test-email`:

```javascript
// GET - Check status
const status = await fetch('/api/test-email')

// POST - Send test email
const result = await fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom', // 'verification', 'welcome', 'custom'
    email: 'test@example.com'
  })
})
```

### Using the Email Service Directly

```typescript
import { emailService } from '@/lib/email'

// Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<h1>Hello World</h1>',
  text: 'Hello World'
})

// Send verification email
await emailService.sendVerificationEmail(
  'user@example.com',
  'https://app.com/verify?token=abc123'
)

// Send welcome email
await emailService.sendWelcomeEmail('user@example.com', 'John Doe')

// Check provider
console.log('Using provider:', emailService.getProvider())
```

## Troubleshooting

### Email Service Not Working

1. Check environment variables are set correctly
2. Verify API keys and credentials
3. Check the email service status:
   ```javascript
   console.log('Provider:', emailService.getProvider())
   ```

### Development Emails Not Appearing

1. Ensure Ethereal Email is configured:
   ```bash
   npm run setup:ethereal
   ```

2. Check the console for preview URLs
3. Visit [https://ethereal.email](https://ethereal.email) and login with your credentials

### Production Emails Not Sending

1. Verify Resend API key is correct
2. Ensure your domain is verified in Resend
3. Check Resend dashboard for delivery logs
4. Verify `EMAIL_FROM` uses your verified domain

### Common Issues

**"No email service configured"**
- Missing environment variables
- Run the appropriate setup script

**"Authentication failed"**
- Incorrect SMTP credentials
- Re-run `npm run setup:ethereal`

**"Domain not verified"**
- Add and verify your domain in Resend dashboard
- Update `EMAIL_FROM` to use verified domain

## Security Notes

- Never commit real API keys to version control
- Use different API keys for staging and production
- Regularly rotate API keys
- Monitor email sending quotas and usage

## Monitoring

### Development
- Emails appear in Ethereal Email inbox
- Preview URLs logged to console
- No real emails are sent

### Production
- Check Resend dashboard for delivery status
- Monitor bounce and complaint rates
- Set up webhooks for delivery notifications

## Migration from SMTP to Resend

If migrating from pure SMTP to Resend:

1. Keep existing SMTP configuration as fallback
2. Add Resend API key to production environment
3. Test thoroughly in staging environment
4. Monitor delivery rates after deployment
5. Remove SMTP fallback once Resend is stable

## Support

For issues with:
- **Ethereal Email**: Check [https://ethereal.email](https://ethereal.email)
- **Resend**: Check [https://resend.com/docs](https://resend.com/docs)
- **Application**: Use the admin email test page or check application logs