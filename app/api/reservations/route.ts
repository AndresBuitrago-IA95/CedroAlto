import { NextResponse } from 'next/server'
import { asc, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reservationNights, reservations, siteContent } from '@/lib/schema'
import { defaultSiteContent } from '@/lib/site-content'
import { isValidSiteContent } from '@/lib/site-content-validation'

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function getNights(arrivalDate: string, departureDate: string) {
  const nights: string[] = []
  const date = new Date(`${arrivalDate}T00:00:00.000Z`)
  const end = new Date(`${departureDate}T00:00:00.000Z`)
  while (date < end) {
    nights.push(date.toISOString().slice(0, 10))
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return nights
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La disponibilidad en línea no está configurada.' }, { status: 503 })
  }
  try {
    const rows = await db
      .select({ date: reservationNights.reservationDate })
      .from(reservationNights)
      .innerJoin(reservations, eq(reservationNights.reservationId, reservations.id))
      .where(or(
        eq(reservations.status, 'confirmed'),
        eq(reservations.status, 'blocked'),
        eq(reservations.status, 'pending'),
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

  const nights = getNights(arrivalDate, departureDate)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  if (
    arrivalDate < today ||
    departureDate <= arrivalDate ||
    (selectedPlan.kind === 'day' ? nights.length !== 1 : nights.length > 30)
  ) {
    return NextResponse.json({ error: 'El rango debe ser futuro y tener entre 1 y 30 noches.' }, { status: 400 })
  }

  try {
    const reservationId = await db.transaction(async (tx) => {
      const [reservation] = await tx
        .insert(reservations)
        .values({
          arrivalDate,
          departureDate,
          plan,
          status: 'pending',
          expiresAt: null,
        })
        .returning({ id: reservations.id })

      await tx.insert(reservationNights).values(
        nights.map((reservationDate) => ({ reservationDate, reservationId: reservation.id })),
      )

      return reservation.id
    })

    return NextResponse.json({ ok: true, reservationId }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Una o más fechas acaban de ser reservadas. Elige otras fechas.' }, { status: 409 })
    }
    console.error('Failed to create reservation hold:', error)
    return NextResponse.json({ error: 'No fue posible bloquear las fechas. Inténtalo de nuevo.' }, { status: 500 })
  }
}
