-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Profiles table extends auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  social_links jsonb default '{}',
  created_at timestamptz default now()
);

-- Theme status enum
create type theme_status as enum ('pending', 'approved', 'rejected');

-- Community themes table
create table if not exists community_themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  status theme_status not null default 'pending',
  ask_file_url text not null,
  preview_image_url text,
  swatch_colors jsonb not null,
  variant_mode text,
  source_image_url text,
  download_count integer not null default 0,
  created_at timestamptz default now(),
  approved_at timestamptz,
  rejection_reason text
);

-- RLS: profiles
alter table profiles enable row level security;

create policy "profiles_select_all" on profiles
  for select using (true);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- RLS: community_themes
alter table community_themes enable row level security;

create policy "themes_select_approved" on community_themes
  for select using (status = 'approved' or auth.uid() = user_id);

create policy "themes_insert_auth" on community_themes
  for insert with check (auth.uid() = user_id);

-- Admin (service role) can update any row — handled by service role key bypassing RLS

-- Helper function to safely increment download count
create or replace function increment_download_count(theme_id uuid)
returns void
language sql
security definer
as $$
  update community_themes
  set download_count = download_count + 1
  where id = theme_id and status = 'approved';
$$;

-- Storage buckets (run these via Supabase dashboard or Storage API):
-- create bucket "theme-files" (public)
-- create bucket "theme-previews" (public)
