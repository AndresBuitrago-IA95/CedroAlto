import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reservations } from '@/lib/schema'

export async function expirePendingReservationHolds() {
  await db.delete(reservations).where(and(
    eq(reservations.status, 'pending'),
    lte(reservations.expiresAt, new Date()),
  ))
}
