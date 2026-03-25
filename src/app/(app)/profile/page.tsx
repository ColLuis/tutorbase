import { verifySession } from '@/lib/dal'
import { getTutorProfile } from '@/lib/queries/tutors'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const { tutorId } = await verifySession()
  const tutor = await getTutorProfile(tutorId)

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-heading mb-6">My Profile</h1>
      <ProfileForm defaultValues={{ name: tutor.name, email: tutor.email }} />
    </div>
  )
}
