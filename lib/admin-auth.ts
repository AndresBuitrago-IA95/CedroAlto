import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextResponse } from 'next/server'

const cookieName = 'cedroalto_admin'
const sessionDurationSeconds = 60 * 60 * 8

export function adminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.length >= 32,
  )
}

function signature(value: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(value).digest('base64url')
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyAdminRequest(request: Request) {
  if (!adminAuthConfigured()) return false
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))
  const token = cookie?.slice(cookieName.length + 1)
  if (!token) return false

  const [payload, providedSignature] = token.split('.')
  if (!payload || !providedSignature || !constantTimeEqual(signature(payload), providedSignature)) return false
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { username?: unknown; expiresAt?: unknown }
    return session.username === process.env.ADMIN_USERNAME &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt > Date.now()
  } catch {
    return false
  }
}

export function requestHasValidOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export function setAdminSessionCookie(response: NextResponse) {
  const expiresAt = Date.now() + sessionDurationSeconds * 1000
  const payload = Buffer.from(JSON.stringify({ username: process.env.ADMIN_USERNAME, expiresAt })).toString('base64url')
  response.cookies.set(cookieName, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDurationSeconds,
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export function credentialsMatch(username: string, password: string) {
  if (!adminAuthConfigured()) return false
  return constantTimeEqual(username, process.env.ADMIN_USERNAME!) &&
    constantTimeEqual(password, process.env.ADMIN_PASSWORD!)
}
