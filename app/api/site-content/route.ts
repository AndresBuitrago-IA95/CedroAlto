import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { siteContent } from '@/lib/schema'
import { defaultSiteContent } from '@/lib/site-content'
import { isValidSiteContent } from '@/lib/site-content-validation'

export async function GET() {
  try {
    const [row] = await db.select({ content: siteContent.content }).from(siteContent).where(eq(siteContent.id, 'main')).limit(1)
    const content = row?.content ?? defaultSiteContent
    if (!isValidSiteContent(content)) {
      console.error('Stored public site content does not match the supported schema.')
      return NextResponse.json({ error: 'La información guardada del sitio no es válida.' }, { status: 500 })
    }
    return NextResponse.json(content, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Failed to load public site content:', error)
    return NextResponse.json({ error: 'No fue posible cargar la información del sitio.' }, { status: 500 })
  }
}
