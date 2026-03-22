import { verifySession } from '@/lib/dal'
import { getStudents } from '@/lib/queries/students'
import StudentList from '@/components/students/StudentList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function StudentsPage() {
  const { tutorId } = await verifySession()
  const students = await getStudents(tutorId, true) // pass all; StudentList filters client-side

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button render={<Link href="/students/new">Add Student</Link>} />
      </div>
      <StudentList students={students} />
    </div>
  )
}
