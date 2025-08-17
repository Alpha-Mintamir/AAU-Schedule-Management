-- 0001_init.sql — Initial schema for University Class Schedule Platform
-- This migration creates users/roles, university structure, courses, schedules,
-- overrides with logging, exams, telegram linkage, and a notification outbox.

-- Extensions (if not already enabled in Supabase project)
create extension if not exists pgcrypto;

-- USERS & ROLES
create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create type user_role as enum (
    'UNIVERSITY_ADMIN',
    'COLLEGE_ADMIN',
    'DEPARTMENT_ADMIN',
    'BATCH_ADMIN',
    'SECTION_REP',
    'INSTRUCTOR',
    'STUDENT'
  );
exception when duplicate_object then null; end $$;

create table if not exists user_role_membership (
  user_id uuid references app_user(id) on delete cascade,
  role user_role not null,
  scope_id uuid,
  primary key (user_id, role, scope_id)
);

-- UNIVERSITY STRUCTURE
create table if not exists college (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists department (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references college(id) on delete cascade,
  name text not null,
  unique (college_id, name)
);

create table if not exists batch (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references department(id) on delete cascade,
  entry_year int not null,
  name text not null,
  unique (department_id, name)
);

create table if not exists section (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batch(id) on delete cascade,
  name text not null,
  unique (batch_id, name)
);

-- COURSES & INSTRUCTORS
create table if not exists course (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references department(id) on delete cascade,
  code text not null,
  title text not null,
  credit_hours int not null,
  unique (department_id, code)
);

create table if not exists instructor (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_user(id) on delete cascade
);

create table if not exists course_assignment (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batch(id) on delete cascade,
  course_id uuid not null references course(id) on delete restrict,
  instructor_id uuid not null references instructor(id) on delete restrict,
  unique (batch_id, course_id)
);

-- Base schedule at batch level
create table if not exists class_meeting (
  id uuid primary key default gen_random_uuid(),
  course_assignment_id uuid not null references course_assignment(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  room text,
  created_by uuid not null references app_user(id),
  created_at timestamptz not null default now()
);

-- Section overrides
do $$ begin
  create type override_action as enum ('RESCHEDULE', 'ROOM_CHANGE', 'CANCEL');
exception when duplicate_object then null; end $$;

create table if not exists section_schedule_override (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references section(id) on delete cascade,
  class_meeting_id uuid not null references class_meeting(id) on delete cascade,
  action override_action not null,
  reason text not null,
  new_date date,
  new_weekday int check (new_weekday between 0 and 6),
  new_starts_at time,
  new_ends_at time,
  new_room text,
  effective_from date not null default current_date,
  created_by uuid not null references app_user(id),
  created_at timestamptz not null default now()
);

-- Change log (immutable)
create table if not exists schedule_change_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references app_user(id),
  section_id uuid references section(id),
  course_assignment_id uuid references course_assignment(id),
  action override_action not null,
  reason text not null,
  details jsonb not null,
  created_at timestamptz not null default now()
);

-- Exams
create table if not exists exam (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batch(id) on delete cascade,
  course_id uuid not null references course(id) on delete cascade,
  exam_date date not null,
  starts_at time not null,
  ends_at time not null,
  room text
);

-- STUDENTS & TELEGRAM
create table if not exists student (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_user(id) on delete cascade,
  section_id uuid not null references section(id) on delete cascade
);

create table if not exists telegram_link (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  telegram_user_id bigint not null,
  chat_id bigint not null,
  linked_at timestamptz not null default now(),
  unique (user_id),
  unique (telegram_user_id),
  unique (chat_id)
);

-- Notification outbox
do $$ begin
  create type notification_kind as enum (
    'SECTION_CHANGE',
    'DAILY_CLASS_REMINDER',
    'EXAM_REMINDER',
    'INSTRUCTOR_CHANGE'
  );
exception when duplicate_object then null; end $$;

create table if not exists notification_outbox (
  id uuid primary key default gen_random_uuid(),
  kind notification_kind not null,
  user_id uuid references app_user(id) on delete cascade,
  section_id uuid references section(id) on delete cascade,
  instructor_id uuid references instructor(id) on delete cascade,
  payload jsonb not null,
  not_before timestamptz not null default now(),
  processed_at timestamptz
);

-- Helpful indexes
create index if not exists idx_class_meeting_course_assignment on class_meeting(course_assignment_id);
create index if not exists idx_override_section_class on section_schedule_override(section_id, class_meeting_id);
create index if not exists idx_exam_batch_date on exam(batch_id, exam_date);
create index if not exists idx_outbox_not_processed on notification_outbox(not_before, processed_at);

-- Enable RLS and an example policy
alter table app_user enable row level security;
do $$ begin
  create policy rls_app_user_self on app_user
    for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;


