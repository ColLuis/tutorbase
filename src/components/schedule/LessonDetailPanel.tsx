'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { updateLessonStatus } from '@/lib/actions/lessons'
import { formatLessonDate } from '@/lib/utils/dates'

interface LessonDetailPanelProps {
  lesson: {
    id: string
    scheduled_at: string
    duration_minutes: number
    rate: number
    status: string
    notes: string | null
    location: string | null
    students: { name: string } | null
    recurring_series_id: string | null
  }
  timezone: string
  onClose: () => void
  onEdit: (lessonId: string) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount)
}

export default function LessonDetailPanel({ lesson, timezone, onClose, onEdit }: LessonDetailPanelProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStatusUpdate = async (status: 'completed' | 'cancelled' | 'no_show') => {
    setIsSubmitting(true)
    const result = await updateLessonStatus(lesson.id, status)
    setIsSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    if (status === 'completed') {
      toast.success('Lesson marked complete')
    } else if (status === 'cancelled') {
      toast.success('Lesson cancelled')
    } else {
      toast.success('Lesson marked as no-show')
    }

    router.refresh()
    onClose()
  }

  const studentName = lesson.students?.name ?? 'Unknown Student'
  const dateStr = formatLessonDate(lesson.scheduled_at, timezone)

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{studentName}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 p-4">
          {/* Lesson info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date &amp; Time</span>
              <span className="font-medium text-right">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{lesson.duration_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">{formatCurrency(lesson.rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{lesson.status.replace('_', ' ')}</span>
            </div>
            {lesson.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{lesson.location}</span>
              </div>
            )}
            {lesson.recurring_series_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recurring</span>
                <span className="font-medium">Yes</span>
              </div>
            )}
            {lesson.notes && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Notes</span>
                <p className="text-sm bg-muted rounded p-2">{lesson.notes}</p>
              </div>
            )}
          </div>

          {/* Status action buttons */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Quick Actions</p>

            {/* Complete button — no confirmation required (D-10) */}
            {lesson.status !== 'completed' && (
              <Button
                onClick={() => handleStatusUpdate('completed')}
                disabled={isSubmitting}
                className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
              >
                Mark Complete
              </Button>
            )}

            {/* Cancel button — requires AlertDialog confirmation (D-10) */}
            {lesson.status !== 'cancelled' && (
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel Lesson
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this lesson?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark this lesson as cancelled? This action can be undone by changing the status again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Lesson</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusUpdate('cancelled')}
                      variant="destructive"
                    >
                      Cancel Lesson
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* No-show button — requires AlertDialog confirmation (D-10) */}
            {lesson.status !== 'no_show' && (
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Mark No-show
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark as no-show?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark this lesson as a no-show? This action can be undone by changing the status again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusUpdate('no_show')}
                      variant="destructive"
                    >
                      Mark No-show
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Edit button */}
            <Button
              variant="outline"
              onClick={() => { onEdit(lesson.id); onClose() }}
              className="w-full min-h-[44px]"
            >
              Edit Lesson
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
