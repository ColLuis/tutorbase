import { fromZonedTime } from 'date-fns-tz'

/**
 * Parses a free-text time input into hours and minutes.
 *
 * Accepted formats: "3:45", "14:00", "2:15 pm", "2:15pm", "3", "15:30"
 *
 * @returns { hours, minutes } in 24-hour format, or null if input is invalid.
 */
export function parseTimeInput(input: string): { hours: number; minutes: number } | null {
  const match = input.trim().match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const period = match[3]?.toLowerCase()

  // Apply AM/PM conversion
  if (period === 'pm' && hours < 12) {
    hours += 12
  } else if (period === 'am' && hours === 12) {
    hours = 0
  }

  // Validate ranges
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null

  return { hours, minutes }
}

/**
 * Combines a date string and free-text time string into a UTC Date, converting
 * from the given timezone.
 *
 * @param dateStr - Date in 'YYYY-MM-DD' format (from calendar picker value)
 * @param timeStr - Free-text time input (e.g. "3:45", "2:15 pm")
 * @param timezone - IANA timezone string (e.g. 'Australia/Sydney')
 * @returns UTC Date, or null if timeStr cannot be parsed.
 */
export function combineDateTime(dateStr: string, timeStr: string, timezone: string): Date | null {
  const parsed = parseTimeInput(timeStr)
  if (!parsed) return null

  const { hours, minutes } = parsed
  const localDatetime = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

  return fromZonedTime(new Date(localDatetime), timezone)
}
