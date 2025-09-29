import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SecurityTester, runSecurityTests } from '@/lib/security-test'

/**
 * GET /api/security-test - Run security tests (Development only)
 */
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Security tests are only available in development' },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow system admins to run security tests
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json(
        { error: 'System admin role required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'all'
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    let report: string

    switch (testType) {
      case 'all':
        report = await runSecurityTests(baseUrl)
        break
      
      case 'rate-limit':
        const tester = new SecurityTester()
        await tester.testRateLimit(`${baseUrl}/api/pages`, 100, 15 * 60 * 1000)
        report = tester.generateReport()
        break
      
      case 'csrf':
        const csrfTester = new SecurityTester()
        await csrfTester.testCSRFProtection(`${baseUrl}/api/pages`)
        report = csrfTester.generateReport()
        break
      
      case 'auth':
        const authTester = new SecurityTester()
        await authTester.testAuthBypass(`${baseUrl}/api/admin/users`)
        report = authTester.generateReport()
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: all, rate-limit, csrf, auth' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error running security tests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/security-test - Test specific security validation
 */
export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Security tests are only available in development' },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json(
        { error: 'System admin role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testPayload, validationType } = body

    if (!testPayload || !validationType) {
      return NextResponse.json(
        { error: 'testPayload and validationType are required' },
        { status: 400 }
      )
    }

    // Import validation functions
    const { 
      secureStringSchema, 
      secureHtmlSchema, 
      secureDgmgumrukEmailSchema,
      secureSearchQuerySchema 
    } = await import('@/lib/validations/security')

    let validationResult: { valid: boolean; error?: string }

    try {
      switch (validationType) {
        case 'string':
          secureStringSchema().parse(testPayload)
          validationResult = { valid: true }
          break
        
        case 'html':
          secureHtmlSchema.parse(testPayload)
          validationResult = { valid: true }
          break
        
        case 'email':
          secureDgmgumrukEmailSchema.parse(testPayload)
          validationResult = { valid: true }
          break
        
        case 'search':
          secureSearchQuerySchema.parse(testPayload)
          validationResult = { valid: true }
          break
        
        default:
          return NextResponse.json(
            { error: 'Invalid validation type' },
            { status: 400 }
          )
      }
    } catch (error) {
      validationResult = { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      }
    }

    return NextResponse.json({
      success: true,
      testPayload,
      validationType,
      result: validationResult,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error testing validation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}