import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { type, email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    let result
    const provider = emailService.getProvider()

    switch (type) {
      case 'verification':
        result = await emailService.sendVerificationEmail(
          email, 
          `${process.env.NEXTAUTH_URL}/auth/signin?email=${encodeURIComponent(email)}`
        )
        break
      
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, 'Test User')
        break
      
      case 'custom':
        result = await emailService.sendEmail({
          to: email,
          subject: 'Test Email from Verida',
          html: `
            <h2>Email Service Test</h2>
            <p>This is a test email sent from Verida using <strong>${provider}</strong> provider.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
          `,
          text: `Email Service Test\n\nThis is a test email sent from Verida using ${provider} provider.\nTimestamp: ${new Date().toISOString()}\nEnvironment: ${process.env.NODE_ENV}`,
        })
        break
      
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      provider,
      messageId: result.data?.id || result.messageId,
      previewUrl: result.previewUrl || null,
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const provider = emailService.getProvider()
    
    return NextResponse.json({
      provider,
      environment: process.env.NODE_ENV,
      configured: provider !== 'none',
      resendConfigured: !!process.env.RESEND_API_KEY,
      smtpConfigured: !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER),
    })
  } catch (error) {
    console.error('Email service status error:', error)
    return NextResponse.json(
      { error: 'Failed to get email service status' },
      { status: 500 }
    )
  }
}