'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createInvoice } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils/currency'
import { formatShortDate } from '@/lib/utils/dates'

interface Lesson {
  id: string
  scheduled_at: string
  duration_minutes: number
  rate: number | string
  notes?: string | null
  location?: string | null
}

interface CreateInvoiceFormProps {
  lessons: Lesson[]
  studentId: string
  studentName: string
  timezone: string
}

export default function CreateInvoiceForm({
  lessons,
  studentId,
  studentName,
  timezone,
}: CreateInvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // All lessons selected by default
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(lessons.map((l) => l.id))
  )

  // Per-lesson overrides for rate and duration
  const [overrides, setOverrides] = useState<
    Record<string, { rate?: number; duration?: number }>
  >({})

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultDueDate = format(addDays(new Date(), 14), 'yyyy-MM-dd')

  const [issuedDate, setIssuedDate] = useState(today)
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [notes, setNotes] = useState('')

  function toggleLesson(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function setOverride(id: string, field: 'rate' | 'duration', value: number) {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  function getRate(lesson: Lesson): number {
    return overrides[lesson.id]?.rate ?? Number(lesson.rate)
  }

  function getDuration(lesson: Lesson): number {
    return overrides[lesson.id]?.duration ?? lesson.duration_minutes
  }

  function calcAmount(lesson: Lesson): number {
    return (getDuration(lesson) / 60) * getRate(lesson)
  }

  const subtotal = lessons
    .filter((l) => selectedIds.has(l.id))
    .reduce((sum, l) => sum + calcAmount(l), 0)

  function handleSubmit(status: 'draft' | 'sent') {
    if (selectedIds.size === 0) {
      toast.error('Select at least one lesson to invoice')
      return
    }

    startTransition(async () => {
      // Build per-lesson overrides JSON: { lessonId: { rate, duration } }
      const lessonOverrides: Record<string, { rate: number; duration: number }> = {}
      for (const id of selectedIds) {
        const lesson = lessons.find((l) => l.id === id)
        if (lesson) {
          lessonOverrides[id] = {
            rate: getRate(lesson),
            duration: getDuration(lesson),
          }
        }
      }

      const formData = new FormData()
      formData.append('studentId', studentId)
      formData.append('lessonIds', Array.from(selectedIds).join(','))
      formData.append('lessonOverrides', JSON.stringify(lessonOverrides))
      formData.append('issuedDate', issuedDate)
      formData.append('dueDate', dueDate)
      if (notes.trim()) formData.append('notes', notes.trim())
      formData.append('status', status)

      const result = await createInvoice(formData)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Invoice created')
        router.push('/invoices/' + result.invoiceId)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Lesson selection */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Select Lessons</h2>
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const amount = calcAmount(lesson)
            const isChecked = selectedIds.has(lesson.id)
            const rate = getRate(lesson)
            const duration = getDuration(lesson)
            return (
              <div
                key={lesson.id}
                className={`rounded-lg border transition-colors ${
                  isChecked ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <label className="flex items-start gap-3 p-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    checked={isChecked}
                    onChange={() => toggleLesson(lesson.id)}
                    aria-label={`Select lesson on ${formatShortDate(lesson.scheduled_at, timezone)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {formatShortDate(lesson.scheduled_at, timezone)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {duration} min &middot; {formatCurrency(rate)}/hr
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {formatCurrency(amount)}
                  </span>
                </label>
                {isChecked && (
                  <div className="flex gap-3 px-3 pb-3 pt-0">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(e) => setOverride(lesson.id, 'duration', Number(e.target.value))}
                        className="h-9"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Rate ($/hr)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={rate}
                        onChange={(e) => setOverride(lesson.id, 'rate', Number(e.target.value))}
                        className="h-9"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Running total */}
        <div className="flex items-center justify-between mt-4 px-3 py-3 rounded-lg bg-muted font-semibold">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
      </section>

      {/* Date fields */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invoice Details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="issuedDate">Issue Date</Label>
          <Input
            id="issuedDate"
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment due within 14 days"
            rows={3}
          />
        </div>
      </section>

      {/* Hidden fields for FormData approach — not used directly (we build FormData manually) */}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          disabled={isPending}
          className="w-full sm:w-auto min-h-[44px]"
          onClick={() => handleSubmit('draft')}
        >
          {isPending ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  )
}
