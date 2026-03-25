import Link from 'next/link'
import { startOfWeek, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils/dates'

interface TodayLessonsProps {
  lessons: Array<{ id: string; scheduled_at: string; status: string; students: { name: string } | null }>
  timezone: string
}

function buildLessonDeepLink(scheduledAt: string, lessonId: string, tz: string): string {
  const zoned = toZonedTime(new Date(scheduledAt), tz)
  const weekStart = startOfWeek(zoned, { weekStartsOn: 1 })
  const weekParam = format(weekStart, 'yyyy-MM-dd')
  return `/schedule?week=${weekParam}&lesson=${lessonId}`
}

export default function TodayLessons({ lessons, timezone }: TodayLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-base font-bold">No upcoming lessons</h2>
        <p className="text-sm text-muted-foreground mt-1">Schedule a new lesson to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {lessons.map((lesson) => {
        const studentName = lesson.students?.name ?? 'Unknown'
        const timeStr = formatTime(lesson.scheduled_at, timezone)
        const deepLink = buildLessonDeepLink(lesson.scheduled_at, lesson.id, timezone)

        return (
          <Link
            key={lesson.id}
            href={deepLink}
            className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="text-sm">{studentName} — {timeStr}</span>
            <Badge variant={lesson.status === 'completed' ? 'secondary' : 'outline'}>
              {lesson.status}
            </Badge>
          </Link>
        )
      })}
    </div>
  )
}
