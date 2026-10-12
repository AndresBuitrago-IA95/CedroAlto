import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { verifyAdminRequest, requestHasValidOrigin } from '@/lib/admin-auth'

const maxFileSize = 5 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'La carga de imágenes no está configurada en el servidor.' }, { status: 503 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'No fue posible leer el archivo enviado.' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0 || file.size > maxFileSize || !allowedTypes.has(file.type)) {
    return NextResponse.json({ error: 'Elige una imagen JPG, PNG, WebP o AVIF de máximo 5 MB.' }, { status: 400 })
  }

  try {
    const blob = await put(`cedro-alto/${crypto.randomUUID()}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload admin image to Vercel Blob:', error)
    return NextResponse.json({ error: 'No fue posible cargar la imagen.' }, { status: 502 })
  }
}
