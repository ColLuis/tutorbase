import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { getStudent } from '@/lib/queries/students'
import { getUnInvoicedLessons } from '@/lib/queries/invoices'
import { getTutorProfile } from '@/lib/queries/tutors'
import CreateInvoiceForm from '@/components/invoices/CreateInvoiceForm'

interface NewInvoicePageProps {
  searchParams: Promise<{ studentId?: string }>
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { tutorId } = await verifySession()
  const { studentId } = await searchParams

  if (!studentId) {
    redirect('/students')
  }

  let student
  try {
    student = await getStudent(tutorId, studentId)
  } catch {
    redirect('/students')
  }

  const [lessons, tutorProfile] = await Promise.all([
    getUnInvoicedLessons(tutorId, studentId),
    getTutorProfile(tutorId),
  ])

  const timezone = tutorProfile?.timezone ?? 'Australia/Sydney'

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/students/${studentId}`}
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← {student.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">New Invoice for {student.name}</h1>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No completed lessons to invoice for this student.</p>
          <Link
            href={`/students/${studentId}`}
            className="text-primary hover:underline text-sm"
          >
            Back to {student.name}
          </Link>
        </div>
      ) : (
        <CreateInvoiceForm
          lessons={lessons}
          studentId={studentId}
          studentName={student.name}
          timezone={timezone}
        />
      )}
    </div>
  )
}
