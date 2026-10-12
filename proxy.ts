import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

function contentSecurityPolicy(nonce: string) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    'frame-src https://www.google.com https://maps.google.com',
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ]
  if (process.env.NODE_ENV === 'production') directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64')
  const policy = contentSecurityPolicy(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', policy)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', policy)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
