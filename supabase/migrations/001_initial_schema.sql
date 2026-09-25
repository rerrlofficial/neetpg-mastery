-- Initial placeholder migration.
-- The production schema will be added after the Supabase project is created.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  image_url text,
  unit text,
  subunit text,
  topic text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
