import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Security checks for all requests
    const securityResponse = performSecurityChecks(req)
    if (securityResponse) {
      return securityResponse
    }

    // Allow access to auth pages without authentication
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }

    // Allow access to CSRF token endpoint for authenticated users
    if (pathname === '/api/csrf-token') {
      return NextResponse.next()
    }

    // Redirect to signin if not authenticated
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check domain restriction
    if (token.email && !token.email.endsWith('@dgmgumruk.com')) {
      const errorUrl = new URL('/auth/error?error=AccessDenied', req.url)
      return NextResponse.redirect(errorUrl)
    }

    // Role-based access control for admin routes
    if (pathname.startsWith('/admin/')) {
      if (token.role !== 'SYSTEM_ADMIN' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Role-based access control for editor routes
    if (pathname.startsWith('/editor/')) {
      if (token.role !== 'SYSTEM_ADMIN' && token.role !== 'ADMIN' && token.role !== 'EDITOR') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Add security headers to response
    const response = NextResponse.next()
    addSecurityHeaders(response)
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (pathname === '/' || 
            pathname.startsWith('/auth/') || 
            pathname.startsWith('/api/auth/') ||
            pathname === '/api/health' ||
            pathname.startsWith('/api/csrf-token') ||
            pathname.startsWith('/api/pages/test')) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

/**
 * Perform security checks on incoming requests
 */
function performSecurityChecks(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  const userAgent = req.headers.get('user-agent') || ''
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  // Block requests with suspicious user agents
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
  ]

  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Check for path traversal attempts
  if (pathname.includes('../') || pathname.includes('..\\')) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Validate origin for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && 
      !pathname.startsWith('/api/auth/')) {
    if (origin && host) {
      const allowedOrigins = [
        `https://${host}`,
        `http://${host}`, // Allow HTTP in development
      ]
      
      if (!allowedOrigins.includes(origin)) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
  }

  // Block requests with suspicious patterns in URL
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /union.*select/i,
    /exec\(/i,
    /eval\(/i,
  ]

  const fullUrl = req.url.toLowerCase()
  if (suspiciousPatterns.some(pattern => pattern.test(fullUrl))) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  return null
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  // Remove server header
  response.headers.delete('server')
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/health (Health check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}