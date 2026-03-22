-- supabase/migrations/001_initial_schema.sql
-- TutorBase initial schema: all tables, RLS policies, indexes, and invoice sequence

-- Invoice number sequence (atomic, race-condition-safe)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Tutors (extends auth.users)
CREATE TABLE tutors (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  business_name  TEXT,
  abn            TEXT,
  bsb            TEXT,
  account_number TEXT,
  bank_name      TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  timezone       TEXT NOT NULL DEFAULT 'Australia/Sydney',
  currency       TEXT NOT NULL DEFAULT 'AUD',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_self_only" ON tutors
  USING (id = auth.uid());

-- Students
CREATE TABLE students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  parent_name  TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  default_rate NUMERIC(10,2),
  notes        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON students
  USING (tutor_id = auth.uid());

-- Lessons
CREATE TABLE lessons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id            UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER NOT NULL,
  rate                NUMERIC(10,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes               TEXT,
  recurring_series_id UUID,
  invoice_id          UUID,  -- FK to invoices added after invoices table
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON lessons
  USING (tutor_id = auth.uid());

-- Invoices
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid')),
  issued_date    DATE,
  due_date       DATE,
  paid_date      DATE,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, invoice_number)
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON invoices
  USING (tutor_id = auth.uid());

-- Add FK from lessons to invoices (now that invoices table exists)
ALTER TABLE lessons ADD CONSTRAINT lessons_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Invoice items
CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tutor_id    UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON invoice_items
  USING (tutor_id = auth.uid());

-- Receipts
CREATE TABLE receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  paid_at        TIMESTAMPTZ NOT NULL,
  amount_paid    NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tutor_id, receipt_number)
);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_isolation" ON receipts
  USING (tutor_id = auth.uid());
