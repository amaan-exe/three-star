import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { botFilterMiddleware } from '@/lib/middleware/bot-filter'
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit'

const ADMIN_COOKIE_NAME = 'rp_admin_session'
const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_COOKIE_SECRET || 'residence-inn-patna-secret-key-32-chars-jwt!'
  )

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bot filter for customer routes (cheapest check first)
  if (pathname.startsWith('/r/') || pathname.startsWith('/api/public/')) {
    const botResponse = botFilterMiddleware(request)
    if (botResponse) return botResponse
  }

  // 2. Rate limiting for public API routes
  if (pathname.startsWith('/api/public/')) {
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse) return rateLimitResponse
  }

  // 3. Admin session verification for dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard')) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value

    let isValid = false
    if (token) {
      try {
        await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
        isValid = true
      } catch {
        isValid = false
      }
    }

    if (!isValid && !pathname.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next({ request: { headers: request.headers } })
}

export const config = {
  matcher: [
    '/r/:path*',
    '/api/public/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
  ],
}
