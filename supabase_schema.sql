-- ==============================================================================
-- HABY EDU PRO - SUPABASE PRODUCTION DATABASE SCHEMA & MIGRATION
-- Project: rdrmptcdxtdjblaqsxjy.supabase.co
-- Region: eu-west-1
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHOOLS TABLE (Idempotent: Creates if missing, adds columns if missing)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  district TEXT,
  region TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Kiomoni Secondary School exists
INSERT INTO public.schools (id, name, code, district, status)
VALUES ('02dff10d-78fb-4af6-ab5a-db1d275d7e06', 'KIOMONI SECONDARY SCHOOL', 'KIOMONI-01', 'Tanga', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  district = EXCLUDED.district;

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'TEACHER',
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add optional user columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Ensure Super Admin is linked to Kiomoni Secondary School
UPDATE public.users 
SET 
  school_id = '02dff10d-78fb-4af6-ab5a-db1d275d7e06',
  full_name = 'Dr. Habibu Akida (Super Admin)',
  role = 'super_admin'
WHERE email = 'habibuakida@gmail.com';

-- 4. STUDENTS TABLE (Enhance existing table with all features)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  stream TEXT,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS reg_no TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'CSEE';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS passport_photo TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS marks JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS average TEXT DEFAULT '0.0';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS division TEXT DEFAULT '-';

-- 5. TEACHERS TABLE (Enhance existing table)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID,
  name TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_role TEXT DEFAULT 'Subject Teacher';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS initial TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_streams JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#1d4ed8';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS max_periods_per_week INTEGER DEFAULT 20;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS exclude_invigilation BOOLEAN DEFAULT FALSE;

-- 6. EXAMS TABLE (Enhance existing table)
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID,
  name TEXT NOT NULL,
  term TEXT,
  year TEXT,
  class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'CSEE';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 7. EXAM RECORDS TABLE (Master Ledger for Printable A4 Results)
CREATE TABLE IF NOT EXISTS public.exam_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT,
  reg_no TEXT,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  level TEXT NOT NULL,
  exam_id TEXT,
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  term TEXT,
  year TEXT,
  marks JSONB DEFAULT '{}'::jsonb,
  total NUMERIC DEFAULT 0,
  average NUMERIC DEFAULT 0,
  division TEXT,
  points INTEGER,
  gpa TEXT,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USAL RECORDS TABLE (Continuous Assessment)
CREATE TABLE IF NOT EXISTS public.usal_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT,
  exam_id TEXT,
  subject TEXT NOT NULL,
  test_1 NUMERIC,
  test_2 NUMERIC,
  midterm NUMERIC,
  project NUMERIC,
  terminal NUMERIC,
  final_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SITTING PLANS TABLE (Examination Hall Layouts)
CREATE TABLE IF NOT EXISTS public.sitting_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  exam_date DATE,
  exam_session TEXT,
  total_candidates INTEGER DEFAULT 0,
  grid_layout JSONB DEFAULT '{}'::jsonb,
  theme TEXT DEFAULT 'navy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SCHOOL DATA (Complete state snapshot for durable multi-tenant sync)
CREATE TABLE IF NOT EXISTS public.school_data (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL UNIQUE,
  school_info JSONB,
  students JSONB DEFAULT '[]'::jsonb,
  teachers JSONB DEFAULT '[]'::jsonb,
  exams JSONB DEFAULT '[]'::jsonb,
  examination_records JSONB DEFAULT '[]'::jsonb,
  timetable_assignments JSONB DEFAULT '[]'::jsonb,
  period_settings JSONB DEFAULT '[]'::jsonb,
  stream_settings JSONB DEFAULT '[]'::jsonb,
  institutional_policy JSONB DEFAULT '{}'::jsonb,
  sessions JSONB DEFAULT '[]'::jsonb,
  supervisors JSONB DEFAULT '[]'::jsonb,
  selected_invigilators JSONB DEFAULT '[]'::jsonb,
  invigilation_assignments JSONB DEFAULT '{}'::jsonb,
  activity_logs JSONB DEFAULT '[]'::jsonb,
  discipline_records JSONB DEFAULT '[]'::jsonb,
  daily_attendance JSONB DEFAULT '{}'::jsonb,
  schemes_of_work JSONB DEFAULT '[]'::jsonb,
  lesson_plans JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables and grant full access to eliminate 401 Unauthorized errors
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_data ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies if any
DROP POLICY IF EXISTS "Allow public all access on schools" ON public.schools;
DROP POLICY IF EXISTS "Allow public all access on users" ON public.users;
DROP POLICY IF EXISTS "Allow public all access on students" ON public.students;
DROP POLICY IF EXISTS "Allow public all access on teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow public all access on exams" ON public.exams;
DROP POLICY IF EXISTS "Allow public all access on exam_records" ON public.exam_records;
DROP POLICY IF EXISTS "Allow public all access on usal_records" ON public.usal_records;
DROP POLICY IF EXISTS "Allow public all access on sitting_plans" ON public.sitting_plans;
DROP POLICY IF EXISTS "Allow public all access on school_data" ON public.school_data;

-- Permissive Policies: Allow read & write with anon/publishable key and authenticated users
CREATE POLICY "Allow public all access on schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on exam_records" ON public.exam_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on usal_records" ON public.usal_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on sitting_plans" ON public.sitting_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on school_data" ON public.school_data FOR ALL USING (true) WITH CHECK (true);

-- 12. HIGH SPEED PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_school ON public.exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_school ON public.exam_records(school_id);
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users(school_id);
