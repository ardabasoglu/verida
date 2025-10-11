import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CSRFProtection } from '@/lib/security'

/**
 * GET /api/csrf-token - Get CSRF token for authenticated users
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate new CSRF token
    const token = CSRFProtection.generateToken()
    
    // Create response with token
    const response = NextResponse.json({
      success: true,
      csrfToken: token
    })

    // Set CSRF token in cookie
    CSRFProtection.setTokenInResponse(response, token)

    return response

  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}