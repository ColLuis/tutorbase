// scripts/seed.ts
// Development seed script — populates the database with sample data.
// Uses the service role key to bypass RLS (intentional for seed data).
//
// Usage:
//   npm run seed
//
// Required environment variables:
//   NEXT_PUBLIC_SUPABASE_URL   — Your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY  — Service role key (bypasses RLS — never expose to browser)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: Missing required environment variables.\n' +
    'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  )
  process.exit(1)
}

// Service role client bypasses RLS — only for seed/admin scripts, never client-side
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seed() {
  console.log('Starting seed...')

  // ─── Step 1: Create or find the tutor auth user ───────────────────────────
  var tutorId: string

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email: 'jane@example.com',
    password: 'password123',
    email_confirm: true,
  })

  if (createError) {
    if (createError.message.includes('already registered') || createError.message.includes('already been registered')) {
      // User already exists — look up by email
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) throw listError

      const existingUser = listData.users.find((u) => u.email === 'jane@example.com')
      if (!existingUser) {
        throw new Error('User jane@example.com already registered but could not be found in user list.')
      }
      tutorId = existingUser.id
      console.log('Auth user already exists, using existing ID:', tutorId)
    } else {
      throw createError
    }
  } else {
    tutorId = createData.user.id
    console.log('Created auth user:', tutorId)
  }

  // ─── Step 2: Upsert tutor profile ─────────────────────────────────────────
  const { error: tutorError } = await supabase.from('tutors').upsert({
    id: tutorId,
    name: 'Jane Tutor',
    email: 'jane@example.com',
    business_name: "Jane's Tutoring",
    abn: '12 345 678 901',
    bsb: '062-000',
    account_number: '1234 5678',
    bank_name: 'Commonwealth Bank',
    invoice_prefix: 'INV',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
  })

  if (tutorError) throw tutorError
  console.log('Upserted tutor profile')

  // ─── Step 3: Insert 3 students ────────────────────────────────────────────
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .insert([
      {
        tutor_id: tutorId,
        name: 'Alice Smith',
        parent_name: 'Margaret Smith',
        parent_email: 'margaret.smith@example.com',
        parent_phone: '0412 345 678',
        default_rate: 75.00,
        notes: 'Year 10 Maths — working on algebra and geometry',
        is_active: true,
      },
      {
        tutor_id: tutorId,
        name: 'Bob Jones',
        parent_name: 'Robert Jones',
        parent_email: 'robert.jones@example.com',
        parent_phone: '0423 456 789',
        default_rate: 80.00,
        notes: 'Year 12 Physics — exam prep focus',
        is_active: true,
      },
      {
        tutor_id: tutorId,
        name: 'Charlie Brown',
        parent_name: 'Linda Brown',
        parent_email: 'linda.brown@example.com',
        parent_phone: '0434 567 890',
        default_rate: 70.00,
        notes: 'Year 8 English — reading comprehension',
        is_active: false,
      },
    ])
    .select()

  if (studentsError) throw studentsError
  if (!students || students.length === 0) throw new Error('No students inserted')
  console.log('Inserted', students.length, 'students')

  const alice = students.find((s) => s.name === 'Alice Smith')!
  const bob = students.find((s) => s.name === 'Bob Jones')!
  const charlie = students.find((s) => s.name === 'Charlie Brown')!

  // ─── Step 4: Insert 4 lessons (mixed statuses) ────────────────────────────
  const now = new Date()
  const pastWeek = (daysAgo: number, hour: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }
  const futureWeek = (daysAhead: number, hour: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysAhead)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .insert([
      {
        tutor_id: tutorId,
        student_id: alice.id,
        scheduled_at: pastWeek(7, 15),
        duration_minutes: 60,
        rate: 75.00,
        status: 'completed',
        notes: 'Covered quadratic equations — student progressing well',
      },
      {
        tutor_id: tutorId,
        student_id: bob.id,
        scheduled_at: pastWeek(5, 16),
        duration_minutes: 90,
        rate: 80.00,
        status: 'completed',
        notes: 'Newton\'s laws of motion revision',
      },
      {
        tutor_id: tutorId,
        student_id: charlie.id,
        scheduled_at: pastWeek(3, 14),
        duration_minutes: 60,
        rate: 70.00,
        status: 'cancelled',
        notes: 'Student unwell — rescheduled',
      },
      {
        tutor_id: tutorId,
        student_id: alice.id,
        scheduled_at: futureWeek(3, 15),
        duration_minutes: 60,
        rate: 75.00,
        status: 'scheduled',
        notes: null,
      },
    ])
    .select()

  if (lessonsError) throw lessonsError
  if (!lessons || lessons.length === 0) throw new Error('No lessons inserted')
  console.log('Inserted', lessons.length, 'lessons')

  const aliceCompletedLesson = lessons.find(
    (l) => l.student_id === alice.id && l.status === 'completed'
  )!

  // ─── Step 5: Insert 1 invoice for Alice ───────────────────────────────────
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .insert([
      {
        tutor_id: tutorId,
        student_id: alice.id,
        invoice_number: 'INV-0001',
        status: 'sent',
        issued_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 75.00,
        total: 75.00,
        notes: 'Maths tutoring — Week 1',
      },
    ])
    .select()

  if (invoicesError) throw invoicesError
  if (!invoices || invoices.length === 0) throw new Error('No invoices inserted')
  console.log('Inserted', invoices.length, 'invoice(s)')

  const invoice = invoices[0]

  // ─── Step 6: Link the completed lesson to the invoice ─────────────────────
  const { error: linkError } = await supabase
    .from('lessons')
    .update({ invoice_id: invoice.id })
    .eq('id', aliceCompletedLesson.id)

  if (linkError) throw linkError
  console.log('Linked completed lesson to invoice')

  // ─── Step 7: Insert invoice item for the lesson ───────────────────────────
  const { error: itemsError } = await supabase.from('invoice_items').insert([
    {
      invoice_id: invoice.id,
      tutor_id: tutorId,
      description: 'Maths tutoring — 1 hour (quadratic equations)',
      quantity: 1,
      unit_price: 75.00,
      amount: 75.00,
      lesson_id: aliceCompletedLesson.id,
    },
  ])

  if (itemsError) throw itemsError
  console.log('Inserted invoice item')

  // ─── Done ──────────────────────────────────────────────────────────────────
  console.log('')
  console.log('Seed complete!')
  console.log('Login with: jane@example.com / password123')
  console.log('')
  console.log('Data created:')
  console.log('  - 1 tutor: Jane Tutor')
  console.log('  - 3 students: Alice Smith, Bob Jones, Charlie Brown (inactive)')
  console.log('  - 4 lessons: 2 completed, 1 cancelled, 1 scheduled')
  console.log('  - 1 invoice: INV-0001 (sent, $75.00 for Alice Smith)')
  console.log('  - 1 invoice item linked to Alice\'s completed lesson')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
