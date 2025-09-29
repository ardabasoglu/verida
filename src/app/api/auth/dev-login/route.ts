import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()

    if (!email || !email.endsWith('@dgmgumruk.com')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email domain' },
        { status: 400 }
      )
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'MEMBER',
          emailVerified: new Date(),
        }
      })
    }

    // Create a verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      }
    })

    // Create the callback URL
    const callbackUrl = `/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}`

    return NextResponse.json({
      success: true,
      callbackUrl,
      message: 'Development login token created'
    })

  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}