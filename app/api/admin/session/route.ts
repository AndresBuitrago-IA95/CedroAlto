import { NextResponse } from 'next/server'
import {
  adminAuthConfigured,
  clearAdminSessionCookie,
  credentialsMatch,
  requestHasValidOrigin,
  setAdminSessionCookie,
  verifyAdminRequest,
} from '@/lib/admin-auth'

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: verifyAdminRequest(request) })
}

export async function POST(request: Request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  if (!adminAuthConfigured()) {
    return NextResponse.json({ error: 'El acceso de administración no está configurado en el servidor.' }, { status: 503 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Escribe el usuario y la contraseña.' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Escribe el usuario y la contraseña.' }, { status: 400 })
  }
  const credentials = body as { username?: unknown; password?: unknown }
  if (
    typeof credentials.username !== 'string' ||
    typeof credentials.password !== 'string' ||
    !credentialsMatch(credentials.username, credentials.password)
  ) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true })
  setAdminSessionCookie(response)
  return response
}

export async function DELETE(request: Request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  const response = NextResponse.json({ authenticated: false })
  clearAdminSessionCookie(response)
  return response
}
