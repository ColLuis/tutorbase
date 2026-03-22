import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifySession() {
  const supabase = await createClient()

  // Try getClaims() first, fall back to getUser()
  try {
    if (typeof supabase.auth.getClaims === 'function') {
      const { data } = await supabase.auth.getClaims()
      if (!data?.claims) redirect('/login')
      return { tutorId: data.claims.sub as string }
    }
  } catch {
    // getClaims not available, fall back
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { tutorId: user.id }
}
