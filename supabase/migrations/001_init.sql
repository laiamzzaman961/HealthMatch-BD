-- supabase/migrations/001_init.sql
-- HealthMatch BD – initial schema

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text not null,
  lat double precision not null,
  lng double precision not null,
  aliases text[] default '{}'
);

create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text not null,
  area_id uuid references areas(id),
  address text,
  lat double precision not null,
  lng double precision not null,
  source text,
  last_verified_at timestamptz
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_bn text not null,
  aliases text[] default '{}'
);

create table if not exists hospital_exams (
  hospital_id uuid references hospitals(id),
  exam_id uuid references exams(id),
  price integer,
  price_source text,
  price_checked_at timestamptz,
  primary key (hospital_id, exam_id)
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text check (gender in ('male','female')) not null,
  gender_verified boolean not null default false,
  hospital_id uuid references hospitals(id),
  phone text,
  visiting_days text[] default '{}',
  visiting_hours text,
  last_verified_at timestamptz,
  source text
);

create table if not exists doctor_exams (
  doctor_id uuid references doctors(id),
  exam_id uuid references exams(id),
  primary key (doctor_id, exam_id)
);
