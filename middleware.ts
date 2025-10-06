import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Optional rate limiting configuration (only if Redis env vars are available)
let ratelimit: any = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Ratelimit } = require('@upstash/ratelimit')
    const { Redis } = require('@upstash/redis')
    const { getValidIP } = require('@/lib/utils/ip-utils')

    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
      prefix: 'ratelimit:middleware',
    })
  }
} catch (error) {
  console.warn('Rate limiting disabled: Upstash Redis not configured')
}

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/signup',
  '/reset-password',
  '/api/auth/callback',
  '/api/health',
  '/_next/static/(.*)',
  '/_next/image(.*)',
  '/(.*?)\.(ico|svg|png|jpg|jpeg|gif|webp|css|js|json|xml|txt|map)$',
]

// Paths that are only accessible when not authenticated
const authPaths = ['/login', '/signup', '/reset-password']

// Paths that are only accessible with specific roles
const adminPaths = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public paths
  if (publicPaths.some(path => 
    pathname === path || 
    new RegExp(`^${path.replace(/\*/g, '.*')}$`).test(pathname)
  )) {
    return NextResponse.next()
  }

  try {
    // Apply rate limiting to API routes (if configured)
    if (ratelimit && pathname.startsWith('/api/')) {
      const { getValidIP } = require('@/lib/utils/ip-utils')
      const ip = getValidIP(request)
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)

      // Set rate limit headers
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())

      if (!success) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        })
      }
    }

    // Get Supabase client with proper session handling
    const { supabase, response } = await createClient(request)

    // Get user session from cookies
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if the path requires authentication
    const isAuthPath = authPaths.some(path => pathname.startsWith(path))
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
    
    // Redirect to login if not authenticated and trying to access protected route
    if (!user && !isAuthPath) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect to dashboard if authenticated and trying to access auth page
    if (user && isAuthPath) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check admin access for admin paths
    if (user && isAdminPath) {
      // For now, we'll allow all authenticated users to access admin routes
      // In a production environment, you should implement proper role-based access control
      // by extending your database schema to include user roles
      console.warn('Admin access check not fully implemented. All authenticated users can access admin routes.');
      // Uncomment the following line to restrict admin access
      // return new NextResponse('Forbidden', { status: 403 })
    }

    // Add security headers to all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.posthog.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.posthog.com",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ')
    }

    // Create a new response with security headers
    const secureResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Apply security headers to the response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      secureResponse.headers.set(key, value)
    })

    return secureResponse
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Return a generic error response
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: request.headers.get('x-request-id') || 'unknown'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|xml|txt|map)$|api/health).*)',
  ],
}