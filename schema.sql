-- FRESH START SCHEMA
-- Run this entire script in the Supabase SQL Editor to set up your database.

-- 0. Clean up existing items (to avoid errors if re-running)
drop function if exists public.get_site_by_slug(text);
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.sites cascade;
drop table if exists public.profiles cascade;

-- 1. Create profiles table
-- This table stores user account information.
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  email text
);

-- 2. Create sites table
-- This table stores the digital business cards.
-- CONSTRAINT: user_id is UNIQUE to enforce ONE site per user.
create table public.sites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade unique, -- ENFORCES SINGLE SITE LIMIT
  internal_name text,
  slug text unique, -- Unique URL slug for the site
  data jsonb not null default '{}'::jsonb -- Stores the full CardData object
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.sites enable row level security;

-- 4. Create Policies for Profiles

-- Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Users can insert their own profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 5. Create Policies for Sites

-- Users can view their own sites
create policy "Users can view own sites"
  on sites for select
  using ( auth.uid() = user_id );

-- Users can insert their own sites
create policy "Users can insert own sites"
  on sites for insert
  with check ( auth.uid() = user_id );

-- Users can update their own sites
create policy "Users can update own sites"
  on sites for update
  using ( auth.uid() = user_id );

-- Users can delete their own sites
create policy "Users can delete own sites"
  on sites for delete
  using ( auth.uid() = user_id );

-- Public read access for published sites via slug (for viewing the card)
-- REPLACED WITH RPC FUNCTION TO PREVENT DATA LEAK
-- create policy "Public can view sites by slug"
--   on sites for select
--   using ( true );

-- Secure function to fetch site by slug (bypassing RLS)
create or replace function get_site_by_slug(slug_input text)
returns setof sites
language sql
security definer
as $$
  select * from sites where slug = slug_input;
$$;

-- 6. Set up Trigger for New User Signup
-- This automatically creates a profile entry when a user signs up via Supabase Auth.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Analytics & Contacts
-- Create analytics_events table
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  type text not null, -- 'view', 'click', 'contact'
  data jsonb default '{}'::jsonb
);

-- Create contact_submissions table
create table public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  name text,
  email text,
  phone text,
  message text,
  data jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.analytics_events enable row level security;
alter table public.contact_submissions enable row level security;

-- RLS Policies for analytics_events
-- Public can insert events (tracking)
create policy "Public can insert analytics events"
  on analytics_events for insert
  with check ( true );

-- Site owners can view events for their sites
create policy "Users can view analytics for own sites"
  on analytics_events for select
  using (
    exists (
      select 1 from sites
      where sites.id = analytics_events.site_id
      and sites.user_id = auth.uid()
    )
  );

-- RLS Policies for contact_submissions
-- Public can insert submissions
create policy "Public can insert contact submissions"
  on contact_submissions for insert
  with check ( true );

-- Site owners can view submissions for their sites
create policy "Users can view submissions for own sites"
  on contact_submissions for select
  using (
    exists (
      select 1 from sites
      where sites.id = contact_submissions.site_id
      and sites.user_id = auth.uid()
    )
  );
