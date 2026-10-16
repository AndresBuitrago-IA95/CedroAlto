import { NextResponse } from 'next/server'
import { asc, eq, inArray, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reservationNights, reservations, siteContent } from '@/lib/schema'
import { expirePendingReservationHolds } from '@/lib/reservation-expiration'
import {
  getMinReservationDate,
  getNightsBetween,
  hasAllowedPlanReservationNights,
  isWeekdayOnlyPlan,
  isWeekendOnlyPlan,
  planReservationError,
} from '@/lib/reservation-rules'
import { defaultSiteContent } from '@/lib/site-content'
import { isValidSiteContent } from '@/lib/site-content-validation'

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La disponibilidad en línea no está configurada.' }, { status: 503 })
  }
  try {
    await expirePendingReservationHolds()
    const rows = await db
      .select({ date: reservationNights.reservationDate })
      .from(reservationNights)
      .innerJoin(reservations, eq(reservationNights.reservationId, reservations.id))
      .where(or(
        eq(reservations.status, 'confirmed'),
        eq(reservations.status, 'blocked'),
      ))
      .orderBy(asc(reservationNights.reservationDate))

    return NextResponse.json(
      { dates: rows.map((row) => row.date) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Failed to load reservation availability:', error)
    return NextResponse.json({ error: 'No fue posible consultar la disponibilidad.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Las reservas en línea no están disponibles. Confirma la disponibilidad por WhatsApp.' }, { status: 503 })
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
  const input = body as Record<string, unknown> | null
  const arrivalDate = input?.arrivalDate
  const departureDate = input?.departureDate
  const plan = input?.plan
  if (!isValidDate(arrivalDate) || !isValidDate(departureDate) || typeof plan !== 'string') {
    return NextResponse.json({ error: 'Selecciona fechas y un plan válidos.' }, { status: 400 })
  }

  let sitePlans: typeof defaultSiteContent.plans
  try {
    const [settings] = await db.select({ content: siteContent.content }).from(siteContent).where(eq(siteContent.id, 'main')).limit(1)
    const content = settings?.content ?? defaultSiteContent
    if (!isValidSiteContent(content)) {
      console.error('Stored plan configuration does not match the supported schema.')
      return NextResponse.json({ error: 'La configuración de planes no es válida.' }, { status: 500 })
    }
    sitePlans = content.plans
  } catch (error) {
    console.error('Failed to load plan configuration for reservation:', error)
    return NextResponse.json({ error: 'No fue posible validar el plan en este momento.' }, { status: 500 })
  }
  const selectedPlan = sitePlans.find((item) => item.name === plan)
  if (!selectedPlan) return NextResponse.json({ error: 'Ese plan ya no está disponible. Actualiza la página.' }, { status: 400 })

  const minArrivalDate = getMinReservationDate()
  if (arrivalDate < minArrivalDate) {
    return NextResponse.json({ error: 'Las reservas deben realizarse con al menos un día de anticipación (no es posible reservar para el mismo día).' }, { status: 400 })
  }

  const nights = getNightsBetween(arrivalDate, departureDate)
  const weekdayOnly = isWeekdayOnlyPlan(selectedPlan)
  const dateRestrictedPlan = weekdayOnly || isWeekendOnlyPlan(selectedPlan)
  const hasAllowedDateRange = !dateRestrictedPlan || hasAllowedPlanReservationNights(selectedPlan, arrivalDate, departureDate)
  if (
    departureDate <= arrivalDate ||
    (selectedPlan.kind === 'day' ? nights.length !== 1 : nights.length > 30) ||
    !hasAllowedDateRange
  ) {
    if (!hasAllowedDateRange) {
      return NextResponse.json({ error: planReservationError(selectedPlan) }, { status: 400 })
    }
    return NextResponse.json({ error: 'El rango debe ser futuro y tener entre 1 y 30 noches.' }, { status: 400 })
  }

  try {
    await expirePendingReservationHolds()

    // Validar que ninguna noche solicitada esté ya confirmada o bloqueada
    if (nights.length > 0) {
      const busyRows = await db
        .select({ date: reservationNights.reservationDate })
        .from(reservationNights)
        .where(inArray(reservationNights.reservationDate, nights))

      if (busyRows.length > 0) {
        return NextResponse.json({ error: 'Una o más fechas seleccionadas ya no están disponibles. Elige otras fechas.' }, { status: 409 })
      }
    }

    // Registramos la solicitud pendiente SIN bloquear las noches públicamente,
    // para evitar que personas ociosas bloqueen las fechas a otros visitantes.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const [reservation] = await db
      .insert(reservations)
      .values({
        arrivalDate,
        departureDate,
        plan,
        status: 'pending',
        expiresAt,
      })
      .returning({ id: reservations.id })

    return NextResponse.json({ ok: true, reservationId: reservation.id }, { status: 201 })
  } catch (error) {
    console.error('Failed to create reservation request:', error)
    return NextResponse.json({ error: 'No fue posible registrar la solicitud. Inténtalo de nuevo.' }, { status: 500 })
  }
}

