-- Run this in Supabase SQL editor
-- Drops old tables and recreates without auth.users dependency

drop table if exists attempts cascade;
drop table if exists game_progress cascade;
drop table if exists profiles cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user;

-- ── profiles ──────────────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  gender     text not null check (gender in ('male', 'female')),
  coins      int  not null default 0,
  is_online  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (first_name, last_name)
);

alter table profiles disable row level security;

-- ── game_progress ──────────────────────────────────────────────────────────
create table game_progress (
  user_id      uuid not null references profiles(id) on delete cascade,
  card_id      text not null,
  status       text not null default 'unlocked' check (status in ('locked','unlocked','done')),
  best_score   int  not null default 0,
  best_time_ms int  not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table game_progress disable row level security;

-- ── attempts ───────────────────────────────────────────────────────────────
create table attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  card_id     text not null,
  answer_text text,
  is_correct  bool not null default false,
  score       int  not null default 0,
  duration_ms int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table attempts disable row level security;
