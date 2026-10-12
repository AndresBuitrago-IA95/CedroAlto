import { NextResponse } from 'next/server'
import { and, asc, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { verifyAdminRequest, requestHasValidOrigin } from '@/lib/admin-auth'
import { expirePendingReservationHolds } from '@/lib/reservation-expiration'
import { reservations } from '@/lib/schema'

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  try {
    await expirePendingReservationHolds()
    const active = await db.select().from(reservations).orderBy(asc(reservations.arrivalDate))
    return NextResponse.json({ reservations: active }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to load admin reservations:', error)
    return NextResponse.json({ error: 'No fue posible cargar las reservas.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'La solicitud debe contener datos válidos.' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'La solicitud debe contener datos válidos.' }, { status: 400 })
  }
  const input = body as { id?: unknown; status?: unknown }
  if (typeof input.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.id) || input.status !== 'confirmed') {
    return NextResponse.json({ error: 'La reserva o el estado no son válidos.' }, { status: 400 })
  }
  try {
    await expirePendingReservationHolds()
    const [updated] = await db.update(reservations)
      .set({ status: 'confirmed', expiresAt: null })
      .where(and(
        eq(reservations.id, input.id),
        eq(reservations.status, 'pending'),
        gt(reservations.expiresAt, new Date()),
      ))
      .returning({ id: reservations.id })
    if (!updated) return NextResponse.json({ error: 'La reserva ya no está pendiente.' }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to confirm reservation:', error)
    return NextResponse.json({ error: 'No fue posible confirmar la reserva.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión como administrador.' }, { status: 401 })
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: 'Origen de solicitud no válido.' }, { status: 403 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'La solicitud debe contener datos válidos.' }, { status: 400 })
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('id' in body) ||
    typeof body.id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(body.id)
  ) {
    return NextResponse.json({ error: 'El identificador de la reserva no es válido.' }, { status: 400 })
  }
  try {
    const [deleted] = await db.delete(reservations).where(eq(reservations.id, body.id)).returning({ id: reservations.id })
    if (!deleted) return NextResponse.json({ error: 'No se encontró esa reserva.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to remove reservation:', error)
    return NextResponse.json({ error: 'No fue posible cancelar la reserva.' }, { status: 500 })
  }
}
