import { toZonedTime, format } from 'date-fns-tz'

export function formatLessonDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, timezone)
  return format(zoned, 'EEE d MMM yyyy, h:mm a', { timeZone: timezone })
}

export function formatShortDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, timezone)
  return format(zoned, 'd MMM yyyy', { timeZone: timezone })
}

export function formatTime(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, timezone)
  return format(zoned, 'h:mm a', { timeZone: timezone })
}
