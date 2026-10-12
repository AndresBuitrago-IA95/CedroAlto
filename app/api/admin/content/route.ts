import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siteContent } from '@/lib/schema'
import { verifyAdminRequest, requestHasValidOrigin } from '@/lib/admin-auth'
import { defaultSiteContent } from '@/lib/site-content'
import { isValidSiteContent } from '@/lib/site-content-validation'

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  try {
    const rows = await db.select({ content: siteContent.content }).from(siteContent)
    const content = rows[0]?.content ?? defaultSiteContent
    if (!isValidSiteContent(content)) {
      console.error('Stored admin site content does not match the supported schema.')
      return NextResponse.json({ error: 'La información guardada del sitio no es válida.' }, { status: 500 })
    }
    return NextResponse.json(content, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to load admin site content:', error)
    return NextResponse.json({ error: 'No fue posible cargar la información del sitio.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  let content: unknown
  try {
    content = await request.json()
  } catch {
    return NextResponse.json({ error: 'El contenido enviado no es JSON válido.' }, { status: 400 })
  }
  if (!isValidSiteContent(content)) {
    return NextResponse.json({ error: 'Revisa los campos: hay información incompleta o inválida.' }, { status: 400 })
  }
  try {
    await db.insert(siteContent)
      .values({ id: 'main', content })
      .onConflictDoUpdate({
        target: siteContent.id,
        set: { content, updatedAt: new Date() },
      })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save admin site content:', error)
    return NextResponse.json({ error: 'No fue posible guardar los cambios.' }, { status: 500 })
  }
}
