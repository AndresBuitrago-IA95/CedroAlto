import type { EditablePlan } from '@/lib/site-content'

const millisecondsPerDay = 24 * 60 * 60 * 1000

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * millisecondsPerDay)
}

function getEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(Date.UTC(year, month - 1, day))
}

function getNextMonday(date: Date) {
  return addDays(date, (8 - date.getUTCDay()) % 7)
}

export function isColombianHoliday(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  const year = date.getUTCFullYear()
  const monthDay = dateKey.slice(5)
  const fixedHolidays = new Set(['01-01', '05-01', '07-20', '08-07', '12-08', '12-25'])
  if (fixedHolidays.has(monthDay)) return true

  const mondayObservedHolidays = [
    `${year}-01-06`,
    `${year}-03-19`,
    `${year}-06-29`,
    `${year}-08-15`,
    `${year}-10-12`,
    `${year}-11-01`,
    `${year}-11-11`,
  ].map((holiday) => {
    const originalDate = new Date(`${holiday}T00:00:00.000Z`)
    return toDateKey(getNextMonday(originalDate))
  })
  if (mondayObservedHolidays.includes(dateKey)) return true

  const easterSunday = getEasterSunday(year)
  const easterHolidays = [
    addDays(easterSunday, -3),
    addDays(easterSunday, -2),
    addDays(easterSunday, 43),
    addDays(easterSunday, 64),
    addDays(easterSunday, 71),
  ]
  return easterHolidays.some((holiday) => toDateKey(holiday) === dateKey)
}

export function isWeekdayOnlyPlan(plan: Pick<EditablePlan, 'kind' | 'name'>) {
  const normalizedName = plan.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO')
  return plan.kind === 'day' || normalizedName.includes('pasadia') || /entre\s*semana/.test(normalizedName)
}

export function isWeekendOnlyPlan(plan: Pick<EditablePlan, 'kind' | 'name'>) {
  const normalizedName = plan.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO')
  return plan.kind === 'overnight' && (normalizedName.includes('fin de semana') || normalizedName.includes('festivo'))
}

export function isPlanReservationDate(plan: Pick<EditablePlan, 'kind' | 'name'>, dateKey: string) {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay()
  if (isWeekdayOnlyPlan(plan)) return weekday >= 1 && weekday <= 4 && !isColombianHoliday(dateKey)
  if (isWeekendOnlyPlan(plan)) return (weekday >= 5 || weekday === 0) || isColombianHoliday(dateKey)
  return true
}

export function planReservationError(plan: Pick<EditablePlan, 'kind' | 'name'>) {
  return `Esa fecha no aplica para el plan ${plan.name}.`
}

export function hasAllowedPlanReservationNights(plan: Pick<EditablePlan, 'kind' | 'name'>, arrivalDate: string, departureDate: string) {
  const date = new Date(`${arrivalDate}T00:00:00.000Z`)
  const departure = new Date(`${departureDate}T00:00:00.000Z`)

  while (date < departure) {
    if (!isPlanReservationDate(plan, toDateKey(date))) return false
    date.setUTCDate(date.getUTCDate() + 1)
  }

  return true
}

export function getBogotaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

export function getMinReservationDate() {
  const today = getBogotaToday()
  const date = new Date(`${today}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function getNightsBetween(arrivalDate: string, departureDate: string): string[] {
  const nights: string[] = []
  const date = new Date(`${arrivalDate}T00:00:00.000Z`)
  const end = new Date(`${departureDate}T00:00:00.000Z`)
  while (date < end) {
    nights.push(date.toISOString().slice(0, 10))
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return nights
}

export function areNightsAvailable(arrivalDate: string, departureDate: string, unavailableNights: Set<string>): boolean {
  const nights = getNightsBetween(arrivalDate, departureDate)
  return nights.every((night) => !unavailableNights.has(night))
}

