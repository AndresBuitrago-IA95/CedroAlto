import { NextResponse } from 'next/server'
import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { verifyAdminRequest, requestHasValidOrigin } from '@/lib/admin-auth'
import { expirePendingReservationHolds } from '@/lib/reservation-expiration'
import { reservationNights, reservations } from '@/lib/schema'
import { getNightsBetween } from '@/lib/reservation-rules'

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

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, input.id))
      .limit(1)

    if (!reservation) {
      return NextResponse.json({ error: 'No se encontró la solicitud de reserva.' }, { status: 404 })
    }
    if (reservation.status === 'confirmed') {
      return NextResponse.json({ error: 'Esta reserva ya está confirmada.' }, { status: 400 })
    }

    const nights = getNightsBetween(reservation.arrivalDate, reservation.departureDate)

    await db.transaction(async (tx) => {
      if (nights.length > 0) {
        const busy = await tx
          .select({ date: reservationNights.reservationDate })
          .from(reservationNights)
          .where(inArray(reservationNights.reservationDate, nights))

        if (busy.length > 0) {
          throw new Error('CONFLICT')
        }

        await tx.insert(reservationNights).values(
          nights.map((reservationDate) => ({
            reservationDate,
            reservationId: reservation.id,
          }))
        )
      }

      await tx.update(reservations)
        .set({ status: 'confirmed', expiresAt: null })
        .where(eq(reservations.id, reservation.id))
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFLICT') {
      return NextResponse.json({ error: 'Una o más fechas de esta reserva ya fueron ocupadas por otra reserva confirmada o bloqueo manual.' }, { status: 409 })
    }
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
