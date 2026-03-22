import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { getStudent } from '@/lib/queries/students'
import DeactivateButton from '@/components/students/DeactivateButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tutorId } = await verifySession()
  const { id } = await params

  let student
  try {
    student = await getStudent(tutorId, id)
  } catch {
    notFound()
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/students" className="text-muted-foreground text-sm hover:text-foreground">
          ← Students
        </Link>
      </div>
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        {!student.is_active && <Badge variant="secondary">Inactive</Badge>}
      </div>
      <div className="space-y-3 mb-8">
        {student.subject && (
          <p>
            <span className="font-medium">Subject:</span> {student.subject}
          </p>
        )}
        {student.parent_name && (
          <p>
            <span className="font-medium">Parent:</span> {student.parent_name}
          </p>
        )}
        {student.parent_email && (
          <p>
            <span className="font-medium">Email:</span> {student.parent_email}
          </p>
        )}
        {student.parent_phone && (
          <p>
            <span className="font-medium">Phone:</span> {student.parent_phone}
          </p>
        )}
        {student.default_rate != null && (
          <p>
            <span className="font-medium">Rate:</span> {formatCurrency(student.default_rate)} / hr
          </p>
        )}
        {student.default_duration_minutes != null && (
          <p>
            <span className="font-medium">Duration:</span> {student.default_duration_minutes} min
          </p>
        )}
        {student.notes && (
          <p>
            <span className="font-medium">Notes:</span> {student.notes}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" render={<Link href={`/students/${id}/edit`}>Edit</Link>} />
        {student.is_active && (
          <DeactivateButton studentId={id} studentName={student.name} />
        )}
      </div>
    </div>
  )
}
