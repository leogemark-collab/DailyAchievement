create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text,
  daily_goal integer not null default 3 check (daily_goal >= 1),
  daily_intention text not null default '',
  achievements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wins (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  date_label text not null,
  day_key text,
  category text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists wins_user_id_idx on public.wins (user_id);
create index if not exists wins_user_day_key_idx on public.wins (user_id, day_key);

create table if not exists public.journal_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  date_label text not null,
  mood text,
  entry text not null,
  analysis jsonb
);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);
create index if not exists journal_entries_user_created_at_idx
  on public.journal_entries (user_id, created_at desc);

create table if not exists public.daily_moods (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key text not null,
  mood_key text not null,
  label text not null,
  emoji text not null,
  saved_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, day_key)
);

create index if not exists daily_moods_user_day_key_idx on public.daily_moods (user_id, day_key);

alter table public.user_settings enable row level security;
alter table public.wins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.daily_moods enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
on public.user_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
on public.user_settings for delete
using (auth.uid() = user_id);

drop policy if exists "wins_select_own" on public.wins;
create policy "wins_select_own"
on public.wins for select
using (auth.uid() = user_id);

drop policy if exists "wins_insert_own" on public.wins;
create policy "wins_insert_own"
on public.wins for insert
with check (auth.uid() = user_id);

drop policy if exists "wins_update_own" on public.wins;
create policy "wins_update_own"
on public.wins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "wins_delete_own" on public.wins;
create policy "wins_delete_own"
on public.wins for delete
using (auth.uid() = user_id);

drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own"
on public.journal_entries for select
using (auth.uid() = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own"
on public.journal_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own"
on public.journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own"
on public.journal_entries for delete
using (auth.uid() = user_id);

drop policy if exists "daily_moods_select_own" on public.daily_moods;
create policy "daily_moods_select_own"
on public.daily_moods for select
using (auth.uid() = user_id);

drop policy if exists "daily_moods_insert_own" on public.daily_moods;
create policy "daily_moods_insert_own"
on public.daily_moods for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_moods_update_own" on public.daily_moods;
create policy "daily_moods_update_own"
on public.daily_moods for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_moods_delete_own" on public.daily_moods;
create policy "daily_moods_delete_own"
on public.daily_moods for delete
using (auth.uid() = user_id);
