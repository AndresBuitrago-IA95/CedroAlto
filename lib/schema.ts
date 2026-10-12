import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationDate: date('reservation_date').notNull().unique(),
  plan: text('plan').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
