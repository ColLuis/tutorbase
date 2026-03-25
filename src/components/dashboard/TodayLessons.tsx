import Link from 'next/link'
import { startOfWeek, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { formatTime } from '@/lib/utils/dates'
import { Clock } from 'lucide-react'

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

const statusConfig: Record<string, { bg: string; label: string }> = {
  scheduled: { bg: 'bg-indigo-100 text-indigo-700 border border-indigo-200', label: 'Scheduled' },
  completed: { bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Cancelled' },
  no_show: { bg: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'No show' },
}

const avatarColors = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function TodayLessons({ lessons, timezone }: TodayLessonsProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No upcoming lessons. Schedule one below.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y">
      {lessons.map((lesson) => {
        const studentName = lesson.students?.name ?? 'Unknown'
        const timeStr = formatTime(lesson.scheduled_at, timezone)
        const deepLink = buildLessonDeepLink(lesson.scheduled_at, lesson.id, timezone)
        const status = statusConfig[lesson.status] ?? statusConfig.scheduled
        const avatarColor = getAvatarColor(studentName)

        return (
          <Link
            key={lesson.id}
            href={deepLink}
            className="flex items-center gap-3 min-h-[56px] py-3 hover:bg-accent/40 -mx-4 px-4 transition-colors first:-mt-1 last:-mb-1"
          >
            <div className={`size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${avatarColor}`}>
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{studentName}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {timeStr}
              </div>
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${status.bg}`}>
              {status.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
