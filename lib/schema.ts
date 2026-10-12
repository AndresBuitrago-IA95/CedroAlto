import { date, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  arrivalDate: date('arrival_date').notNull(),
  departureDate: date('departure_date').notNull(),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const reservationNights = pgTable('reservation_nights', {
  reservationDate: date('reservation_date').primaryKey(),
  reservationId: uuid('reservation_id')
    .notNull()
    .references(() => reservations.id, { onDelete: 'cascade' }),
})

export const siteContent = pgTable('site_content', {
  id: text('id').primaryKey(),
  content: jsonb('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
