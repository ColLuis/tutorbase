import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getStudent } from '@/lib/queries/students'
import StudentForm from '@/components/students/StudentForm'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
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
      <h1 className="text-2xl font-bold font-heading mb-6">Edit Student</h1>
      <StudentForm
        mode="edit"
        studentId={id}
        defaultValues={{
          name: student.name,
          parent_name: student.parent_name ?? undefined,
          parent_email: student.parent_email ?? undefined,
          parent_phone: student.parent_phone ?? undefined,
          subject: student.subject ?? undefined,
          default_rate: student.default_rate ?? undefined,
          default_duration_minutes: student.default_duration_minutes ?? undefined,
          notes: student.notes ?? undefined,
        }}
      />
    </div>
  )
}
