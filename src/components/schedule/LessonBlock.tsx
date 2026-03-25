'use client'

import { formatTime } from '@/lib/utils/dates'

interface LessonBlockProps {
  lesson: {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
    students: { name: string } | null
  }
  timezone: string
  onClick: (lessonId: string) => void
  compact?: boolean
}

const statusStyles: Record<string, string> = {
  scheduled: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100',
  no_show: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
}

export default function LessonBlock({ lesson, timezone, onClick, compact = false }: LessonBlockProps) {
  const studentName = lesson.students?.name ?? 'Unknown'
  const timeStr = formatTime(lesson.scheduled_at, timezone)
  const colorClass = statusStyles[lesson.status] ?? statusStyles.scheduled

  return (
    <button
      onClick={() => onClick(lesson.id)}
      className={`
        w-full text-left rounded-lg border px-2.5 py-1.5 min-h-[44px]
        flex flex-col justify-center transition-colors
        ${colorClass}
        ${compact ? 'text-xs' : 'text-sm'}
      `}
    >
      <span className={`font-medium leading-tight ${compact ? 'truncate block' : ''}`}>
        {studentName}
      </span>
      <span className="opacity-70 text-xs leading-tight">{timeStr}</span>
    </button>
  )
}
