import StudentForm from '@/components/students/StudentForm'

export default function NewStudentPage() {
  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-heading mb-6">Add Student</h1>
      <StudentForm mode="create" />
    </div>
  )
}
