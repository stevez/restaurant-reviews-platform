import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  // Verify token and get user data
  let user = null
  if (token) {
    const verified = await verifyToken(token)
    if (verified) {
      user = verified
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && user) {
    const redirectUrl = user.role === 'OWNER'
      ? '/owner/my-restaurants'
      : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Protect /owner routes - require OWNER role
  if (pathname.startsWith('/owner')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect /reviewer routes - require authentication
  if (pathname.startsWith('/reviewer')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/owner/:path*',
    '/reviewer/:path*',
    '/login',
    '/register',
  ],
}
