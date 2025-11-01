import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Email service that switches between Resend (production) and Ethereal/SMTP (development)
class EmailService {
  private resend: Resend | null = null
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    console.log('🔧 Initializing EmailService...')
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`   RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`)
    console.log(`   EMAIL_SERVER_HOST present: ${!!process.env.EMAIL_SERVER_HOST}`)
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}`)

    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      console.log('🚀 Setting up Resend for production...')
      this.resend = new Resend(process.env.RESEND_API_KEY)
      console.log('✅ Resend client initialized')
    } else if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
      console.log('📧 Setting up SMTP for development...')
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
      console.log('✅ SMTP transporter initialized')
    } else {
      console.warn('⚠️  No email service configured!')
      console.log('   Available environment variables:')
      console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`)
      console.log(`   - RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'}`)
      console.log(`   - EMAIL_SERVER_HOST: ${process.env.EMAIL_SERVER_HOST || 'NOT SET'}`)
      console.log(`   - EMAIL_SERVER_USER: ${process.env.EMAIL_SERVER_USER || 'NOT SET'}`)
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
    const fromAddress = from || process.env.EMAIL_FROM || 'noreply@verida.dgmgumruk.com'
    const recipients = Array.isArray(to) ? to : [to]

    console.log('📧 Attempting to send email...')
    console.log(`   From: ${fromAddress}`)
    console.log(`   To: ${recipients.join(', ')}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Provider: ${this.getProvider()}`)
    console.log(`   HTML content length: ${html?.length || 0}`)
    console.log(`   Text content length: ${text?.length || 0}`)

    try {
      if (this.resend) {
        console.log('🚀 Using Resend API...')

        const emailPayload = {
          from: fromAddress,
          to: recipients,
          subject,
          html: html || text || '',
          text: text || undefined,
        }

        console.log('📤 Resend payload:', {
          from: emailPayload.from,
          to: emailPayload.to,
          subject: emailPayload.subject,
          hasHtml: !!emailPayload.html,
          hasText: !!emailPayload.text,
        })

        const result = await this.resend.emails.send(emailPayload)

        console.log('📥 Resend response:', {
          success: !result.error,
          data: result.data,
          error: result.error,
        })

        // Check for errors in the response
        if (result.error) {
          console.error('❌ Resend API error details:', {
            message: result.error.message,
            name: result.error.name,
          })
          throw new Error(`Resend API error: ${result.error.message}`)
        }

        console.log('✅ Email sent successfully via Resend!')
        console.log(`   Email ID: ${result.data?.id}`)
        return result
      } else if (this.transporter) {
        console.log('📧 Using SMTP transporter...')

        const mailOptions = {
          from: fromAddress,
          to: recipients.join(', '),
          subject,
          html: html || text,
          text: text || undefined,
        }

        console.log('📤 SMTP payload:', {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          hasHtml: !!mailOptions.html,
          hasText: !!mailOptions.text,
        })

        const result = await this.transporter.sendMail(mailOptions)

        console.log('✅ Email sent successfully via SMTP!')
        console.log(`   Message ID: ${result.messageId}`)

        if (process.env.NODE_ENV === 'development') {
          const previewUrl = nodemailer.getTestMessageUrl(result)
          console.log(`📧 Preview URL: ${previewUrl}`)
        }
        return result
      } else {
        const errorMsg = 'No email service configured - neither Resend nor SMTP is available'
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : 'Error'
      const errorStack = error instanceof Error ? error.stack : undefined

      console.error('❌ Failed to send email:', {
        message: errorMessage,
        name: errorName,
        stack: errorStack,
        provider: this.getProvider(),
        fromAddress,
        recipients,
        subject,
      })
      throw error
    }
  }

  async sendVerificationEmail(email: string, url: string) {
    console.log('🔐 Sending verification email...')
    console.log(`   Email: ${email}`)
    console.log(`   URL: ${url}`)

    const subject = 'Verida\'ya Giriş Yapın'
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verida'ya Giriş Yapın</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verida'ya Hoş Geldiniz</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hesabınıza giriş yapın</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">
              Verida hesabınıza giriş yapmak için aşağıdaki butona tıklayın. Bu bağlantı 24 saat içinde geçerliliğini yitirecektir.
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
                Verida'ya Giriş Yap
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              Buton çalışmıyorsa, bu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:
            </p>
            <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 5px;">
              ${url}
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>Bu e-posta ${email} adresine gönderilmiştir. Eğer bu isteği siz yapmadıysanız, güvenle görmezden gelebilirsiniz.</p>
            <p>© ${new Date().getFullYear()} Verida. Tüm hakları saklıdır.</p>
          </div>
        </body>
      </html>
    `

    const text = `
      Verida'ya Giriş Yapın
      
      Hesabınıza giriş yapmak için aşağıdaki bağlantıya tıklayın:
      ${url}
      
      Bu bağlantı 24 saat içinde geçerliliğini yitirecektir.
      
      Eğer bu isteği siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.
    `

    console.log('📤 Sending verification email with sendEmail method...')
    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    })
  }

  async sendWelcomeEmail(email: string, name?: string) {
    console.log('🎉 Sending welcome email...')
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${name || 'not provided'}`)

    const subject = 'Verida\'ya Hoş Geldiniz!'
    const displayName = name || email.split('@')[0]

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verida'ya Hoş Geldiniz</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verida'ya Hoş Geldiniz!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Merhaba ${displayName}! 👋</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Verida'ya hoş geldiniz! Sizi aramızda görmekten çok mutluyuz. Hesabınız başarıyla oluşturuldu ve başlamaya hazırsınız.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Sırada ne var?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Platformu ve özelliklerini keşfedin</li>
                <li>Profil kurulumunuzu tamamlayın</li>
                <li>Diğer üyelerle bağlantı kurun</li>
                <li>Projelerde işbirliği yapmaya başlayın</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              Herhangi bir sorunuz varsa veya başlarken yardıma ihtiyacınız olursa, destek ekibimizle iletişime geçmekten çekinmeyin.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Verida. Tüm hakları saklıdır.</p>
          </div>
        </body>
      </html>
    `

    const text = `
      Verida'ya Hoş Geldiniz!
      
      Merhaba ${displayName}!
      
      Verida'ya hoş geldiniz! Sizi aramızda görmekten çok mutluyuz. Hesabınız başarıyla oluşturuldu ve başlamaya hazırsınız.
      
      Sırada ne var?
      - Platformu ve özelliklerini keşfedin
      - Profil kurulumunuzu tamamlayın
      - Diğer üyelerle bağlantı kurun
      - Projelerde işbirliği yapmaya başlayın
      
      Herhangi bir sorunuz varsa veya başlarken yardıma ihtiyacınız olursa, destek ekibimizle iletişime geçmekten çekinmeyin.
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