import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { getStudent } from '@/lib/queries/students'
import DeactivateButton from '@/components/students/DeactivateButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'
import { Pencil, FileText, BookOpen, User, Mail, Phone, DollarSign, Clock, StickyNote } from 'lucide-react'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tutorId } = await verifySession()
  const { id } = await params

  let student
  try {
    student = await getStudent(tutorId, id)
  } catch {
    notFound()
  }

  const details = [
    { icon: BookOpen, label: 'Subject', value: student.subject, color: 'text-indigo-600 bg-indigo-100' },
    { icon: User, label: 'Parent', value: student.parent_name, color: 'text-violet-600 bg-violet-100' },
    { icon: Mail, label: 'Email', value: student.parent_email, color: 'text-blue-600 bg-blue-100' },
    { icon: Phone, label: 'Phone', value: student.parent_phone, color: 'text-emerald-600 bg-emerald-100' },
    { icon: DollarSign, label: 'Rate', value: student.default_rate != null ? `${formatCurrency(student.default_rate)} / hr` : null, color: 'text-amber-600 bg-amber-100' },
    { icon: Clock, label: 'Duration', value: student.default_duration_minutes != null ? `${student.default_duration_minutes} min` : null, color: 'text-teal-600 bg-teal-100' },
    { icon: StickyNote, label: 'Notes', value: student.notes, color: 'text-gray-600 bg-gray-100' },
  ].filter(d => d.value)

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/students" className="text-muted-foreground text-sm hover:text-primary transition-colors">
          ← Students
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold font-heading text-primary">
            {student.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-heading truncate">{student.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {student.subject && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 text-xs font-medium">
                {student.subject}
              </span>
            )}
            {!student.is_active && (
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 text-xs font-medium">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details card */}
      {details.length > 0 && (
        <Card className="mb-6">
          <CardContent className="divide-y">
            {details.map((detail) => {
              const Icon = detail.icon
              return (
                <div key={detail.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${detail.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{detail.label}</div>
                    <div className="text-sm font-medium truncate">{detail.value}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="min-h-[44px]"
            render={
              <Link href={`/students/${id}/edit`}>
                <Pencil className="size-4 text-muted-foreground" />
                Edit Student
              </Link>
            }
          />
          {student.is_active && (
            <Button
              className="min-h-[44px]"
              render={
                <Link href={`/invoices/new?studentId=${id}`}>
                  <FileText className="size-4" />
                  Create Invoice
                </Link>
              }
            />
          )}
        </div>
        {student.is_active && (
          <DeactivateButton studentId={id} studentName={student.name} />
        )}
      </div>
    </div>
  )
}
