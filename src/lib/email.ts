import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Email service that switches between Resend (production) and Ethereal/SMTP (development)
class EmailService {
  private resend: Resend | null = null
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    } else if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
    }
  }

  async sendEmail({
    to,
    subject,
    html,
    text,
    from,
  }: {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    from?: string
  }) {
    const fromAddress = from || process.env.EMAIL_FROM || 'noreply@dgmgumruk.com'

    try {
      if (this.resend) {
        // Use Resend for production
        const result = await this.resend.emails.send({
          from: fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: html || text || '',
          text: text || undefined,
        })
        
        console.log('✅ Email sent via Resend:', result.data?.id)
        return result
      } else if (this.transporter) {
        // Use SMTP (Ethereal Email) for development
        const result = await this.transporter.sendMail({
          from: fromAddress,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html: html || text,
          text: text || undefined,
        })
        
        console.log('✅ Email sent via SMTP:', result.messageId)
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result))
        }
        return result
      } else {
        throw new Error('No email service configured')
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      throw error
    }
  }

  async sendVerificationEmail(email: string, url: string) {
    const subject = 'Sign in to Verida'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Verida</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Verida</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Sign in to your account</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">
              Click the button below to sign in to your Verida account. This link will expire in 24 hours.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Sign In to Verida
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 5px;">
              ${url}
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>This email was sent to ${email}. If you didn't request this, you can safely ignore it.</p>
            <p>© ${new Date().getFullYear()} Verida. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const text = `
      Sign in to Verida
      
      Click the link below to sign in to your account:
      ${url}
      
      This link will expire in 24 hours.
      
      If you didn't request this, you can safely ignore this email.
    `

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    })
  }

  async sendWelcomeEmail(email: string, name?: string) {
    const subject = 'Welcome to Verida!'
    const displayName = name || email.split('@')[0]
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Verida</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Verida!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${displayName}! 👋</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Welcome to Verida! We're excited to have you on board. Your account has been successfully created and you're ready to get started.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">What's next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Explore the platform and its features</li>
                <li>Complete your profile setup</li>
                <li>Connect with other members</li>
                <li>Start collaborating on projects</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              If you have any questions or need help getting started, don't hesitate to reach out to our support team.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Verida. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const text = `
      Welcome to Verida!
      
      Hello ${displayName}!
      
      Welcome to Verida! We're excited to have you on board. Your account has been successfully created and you're ready to get started.
      
      What's next?
      - Explore the platform and its features
      - Complete your profile setup
      - Connect with other members
      - Start collaborating on projects
      
      If you have any questions or need help getting started, don't hesitate to reach out to our support team.
    `

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    })
  }

  getProvider(): 'resend' | 'smtp' | 'none' {
    if (this.resend) return 'resend'
    if (this.transporter) return 'smtp'
    return 'none'
  }
}

export const emailService = new EmailService()