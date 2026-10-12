import { NextResponse } from 'next/server'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reservations } from '@/lib/schema'

export async function GET() {
  const rows = await db.select({ date: reservations.reservationDate }).from(reservations).orderBy(asc(reservations.reservationDate))
  return NextResponse.json({ dates: rows.map((row) => row.date) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const reservationDate = typeof body?.date === 'string' ? body.date : ''
  const plan = typeof body?.plan === 'string' ? body.plan.trim() : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate) || !plan || plan.length > 80) {
    return NextResponse.json({ error: 'Fecha y plan válidos son obligatorios.' }, { status: 400 })
  }

  try {
    await db.insert(reservations).values({ reservationDate, plan })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('reservations_reservation_date_unique')) {
      return NextResponse.json({ error: 'Esta fecha acaba de ser reservada.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'No fue posible guardar la fecha.' }, { status: 500 })
  }
}
