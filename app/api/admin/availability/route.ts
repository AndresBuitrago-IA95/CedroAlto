import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest, requestHasValidOrigin } from '@/lib/admin-auth'
import { expirePendingReservationHolds } from '@/lib/reservation-expiration'
import { reservationNights, reservations } from '@/lib/schema'

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export async function POST(request: Request) {
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
  const input = body as { startDate?: unknown; endDate?: unknown; reason?: unknown }
  if (
    !isDate(input.startDate) ||
    !isDate(input.endDate) ||
    input.endDate < input.startDate ||
    typeof input.reason !== 'string' ||
    input.reason.length > 100
  ) {
    return NextResponse.json({ error: 'Selecciona un rango de fechas y un motivo válidos.' }, { status: 400 })
  }

  // Si startDate === endDate, se bloquea esa noche (check-in 3pm, check-out 12m del día siguiente).
  // Si endDate > startDate, endDate es la fecha de salida a las 12m (la noche de endDate NO se bloquea).
  const arrivalDate = input.startDate
  let departureDate: string
  if (input.endDate === input.startDate) {
    const nextDay = new Date(`${input.startDate}T00:00:00Z`)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    departureDate = nextDay.toISOString().slice(0, 10)
  } else {
    departureDate = input.endDate
  }

  const start = new Date(`${arrivalDate}T00:00:00Z`)
  const end = new Date(`${departureDate}T00:00:00Z`)
  if ((end.getTime() - start.getTime()) / 86_400_000 > 90) {
    return NextResponse.json({ error: 'Puedes bloquear hasta 90 días a la vez.' }, { status: 400 })
  }

  const dates: string[] = []
  for (const current = new Date(start); current < end; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(current.toISOString().slice(0, 10))
  }

  try {
    await expirePendingReservationHolds()
    await db.transaction(async (tx) => {
      const [block] = await tx.insert(reservations).values({
        arrivalDate,
        departureDate,
        plan: `Bloqueo manual${input.reason ? `: ${input.reason}` : ''}`,
        status: 'blocked',
        expiresAt: null,
      }).returning({ id: reservations.id })
      await tx.insert(reservationNights).values(dates.map((reservationDate) => ({
        reservationDate,
        reservationId: block.id,
      })))
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'El rango incluye fechas ya reservadas o bloqueadas.' }, { status: 409 })
    }
    console.error('Failed to block availability:', error)
    return NextResponse.json({ error: 'No fue posible bloquear ese rango.' }, { status: 500 })
  }
}
