'use client'

import { addDays, format, startOfWeek } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import LessonBlock from './LessonBlock'

interface Lesson {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  students: { name: string } | null
}

interface WeekCalendarProps {
  lessons: Lesson[]
  timezone: string
  weekStart: Date // Monday of displayed week (weekStartsOn: 1)
  onLessonClick: (lessonId: string) => void
}

const SLOT_HEIGHT = 60 // px per hour
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getHourRange(lessons: Lesson[], timezone: string): { dayStart: number; dayEnd: number } {
  if (lessons.length === 0) {
    return { dayStart: 9, dayEnd: 18 }
  }

  let earliest = 23
  let latest = 0

  for (const lesson of lessons) {
    const zoned = toZonedTime(new Date(lesson.scheduled_at), timezone)
    const startHour = zoned.getHours() + zoned.getMinutes() / 60
    const endHour = startHour + lesson.duration_minutes / 60

    if (startHour < earliest) earliest = startHour
    if (endHour > latest) latest = endHour
  }

  // Add 1 hour padding, floor/ceil to nearest hour
  const dayStart = Math.max(0, Math.floor(earliest) - 1)
  const dayEnd = Math.min(24, Math.ceil(latest) + 1)

  return { dayStart, dayEnd }
}

function topOffset(scheduledAt: string, timezone: string, dayStartHour: number): number {
  const zoned = toZonedTime(new Date(scheduledAt), timezone)
  const hour = zoned.getHours() + zoned.getMinutes() / 60
  return (hour - dayStartHour) * SLOT_HEIGHT
}

function blockHeight(durationMinutes: number): number {
  return Math.max(44, (durationMinutes / 60) * SLOT_HEIGHT)
}

function getDayOfWeek(date: Date, timezone: string): number {
  const zoned = toZonedTime(date, timezone)
  // 0=Sun, 1=Mon...6=Sat → convert to Mon-first: 0=Mon, 6=Sun
  const day = zoned.getDay()
  return day === 0 ? 6 : day - 1
}

export default function WeekCalendar({ lessons, timezone, weekStart, onLessonClick }: WeekCalendarProps) {
  // Ensure week starts on Monday (weekStartsOn: 1)
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 })
  const { dayStart, dayEnd } = getHourRange(lessons, timezone)
  const totalHours = dayEnd - dayStart
  const gridHeight = totalHours * SLOT_HEIGHT

  // Build 7 day columns
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  // Group lessons by day column index (0=Mon, 6=Sun)
  const lessonsByDay: Record<number, Lesson[]> = {}
  for (const lesson of lessons) {
    const lessonDate = new Date(lesson.scheduled_at)
    const col = getDayOfWeek(lessonDate, timezone)
    if (!lessonsByDay[col]) lessonsByDay[col] = []
    lessonsByDay[col].push(lesson)
  }

  // Build hour markers for the time column
  const hourMarkers = Array.from({ length: totalHours + 1 }, (_, i) => {
    const hour = dayStart + i
    const h = hour % 12 === 0 ? 12 : hour % 12
    const ampm = hour < 12 ? 'am' : 'pm'
    return `${h}${ampm}`
  })

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
          <div className="h-10" /> {/* time column spacer */}
          {days.map((day, i) => (
            <div key={i} className="h-10 flex flex-col items-center justify-center border-l text-xs">
              <span className="font-medium">{DAY_LABELS[i]}</span>
              <span className="text-muted-foreground">{format(day, 'd')}</span>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          {/* Time column */}
          <div className="relative" style={{ height: gridHeight }}>
            {hourMarkers.map((label, i) => (
              <div
                key={i}
                className="absolute right-1 text-xs text-muted-foreground"
                style={{ top: i * SLOT_HEIGHT - 8 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((_, colIdx) => (
            <div
              key={colIdx}
              className="relative border-l border-b"
              style={{ height: gridHeight }}
            >
              {/* Hour gridlines */}
              {hourMarkers.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: i * SLOT_HEIGHT }}
                />
              ))}

              {/* Lesson blocks */}
              {(lessonsByDay[colIdx] ?? []).map(lesson => (
                <div
                  key={lesson.id}
                  className="absolute left-1 right-1"
                  style={{
                    top: topOffset(lesson.scheduled_at, timezone, dayStart),
                    height: blockHeight(lesson.duration_minutes),
                  }}
                >
                  <LessonBlock
                    lesson={lesson as Parameters<typeof LessonBlock>[0]['lesson']}
                    timezone={timezone}
                    onClick={onLessonClick}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {lessons.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No lessons this week
          </div>
        )}
      </div>
    </div>
  )
}
