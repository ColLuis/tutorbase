'use client'

import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import LessonBlock from './LessonBlock'

interface Lesson {
  id: string
  scheduled_at: string
  duration_minutes: number
  rate: number
  status: string
  students: { name: string } | null
}

interface LessonListProps {
  lessons: Lesson[]
  timezone: string
  onLessonClick: (lessonId: string) => void
}

function groupLessonsByDay(lessons: Lesson[], timezone: string): Record<string, Lesson[]> {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const zoned = toZonedTime(new Date(lesson.scheduled_at), timezone)
    const dayKey = format(zoned, 'yyyy-MM-dd')
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(lesson)
    return acc
  }, {})
}

function formatDayHeader(dayKey: string, timezone: string): string {
  // dayKey is 'yyyy-MM-dd' in local timezone
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return format(date, 'EEEE, d MMM')
}

export default function LessonList({ lessons, timezone, onLessonClick }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">No lessons this week.</p>
        <p className="text-muted-foreground text-xs mt-1">Tap + Lesson to schedule one.</p>
      </div>
    )
  }

  const grouped = groupLessonsByDay(lessons, timezone)
  const sortedDays = Object.keys(grouped).sort()

  return (
    <div className="space-y-6 p-4">
      {sortedDays.map(dayKey => (
        <div key={dayKey}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {formatDayHeader(dayKey, timezone)}
          </h3>
          <div className="space-y-2">
            {grouped[dayKey].map(lesson => (
              <LessonBlock
                key={lesson.id}
                lesson={lesson as Parameters<typeof LessonBlock>[0]['lesson']}
                timezone={timezone}
                onClick={onLessonClick}
                compact={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
