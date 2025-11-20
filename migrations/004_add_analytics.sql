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
