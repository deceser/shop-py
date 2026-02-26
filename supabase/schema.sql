-- Run this in Supabase SQL editor

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null default 'Гравець',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: own read"   on profiles for select using (auth.uid() = id);
create policy "profiles: own insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id);

-- ── game_progress ──────────────────────────────────────────────────────────
create table if not exists game_progress (
  user_id      uuid not null references profiles(id) on delete cascade,
  card_id      text not null,
  status       text not null default 'unlocked' check (status in ('locked','unlocked','done')),
  best_score   int  not null default 0,
  best_time_ms int  not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table game_progress enable row level security;

create policy "progress: own read"   on game_progress for select using (auth.uid() = user_id);
create policy "progress: own insert" on game_progress for insert with check (auth.uid() = user_id);
create policy "progress: own update" on game_progress for update using (auth.uid() = user_id);

-- ── attempts ───────────────────────────────────────────────────────────────
create table if not exists attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  card_id     text not null,
  answer_text text,
  is_correct  bool not null default false,
  score       int  not null default 0,
  duration_ms int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table attempts enable row level security;

create policy "attempts: own read"   on attempts for select using (auth.uid() = user_id);
create policy "attempts: own insert" on attempts for insert with check (auth.uid() = user_id);

-- ── auto-create profile on signup ─────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Гравець'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
