-- Migration: Fix RLS Policy Leak
-- Run this script in your Supabase SQL Editor

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view sites by slug" ON public.sites;

-- Re-create it with a stricter definition
-- Only allow access if the query is specifically filtering by slug (this is hard to enforce in RLS directly without a function, 
-- but we can at least ensure it doesn't grant blanket access to all rows for authenticated users).
-- Actually, for public profiles, we want ANYONE to see it, but we don't want it to show up in the dashboard list.
-- The dashboard query uses `select * from sites`.
-- The public view query uses `select * from sites where slug = '...'`.

-- We can use a trick: The dashboard query should filter by `user_id = auth.uid()`. 
-- DashboardLayout.tsx currently does: `.from('sites').select('*')`. 
-- It relies on RLS to filter.
-- If we have a policy `using (true)`, then RLS returns EVERYTHING.

-- SOLUTION:
-- 1. The "Users can view own sites" policy handles the dashboard.
-- 2. The "Public can view sites by slug" policy is the problem. 
-- We should probably NOT have a blanket `using (true)` policy for select if we rely on RLS for the dashboard.
-- OR, we update the Dashboard query to explicitly filter by user_id.

-- BETTER SOLUTION (Database side):
-- Update the public policy to be more specific if possible, OR just rely on the client to filter? 
-- No, RLS is for security. We don't want users listing ALL sites.
-- So "Public can view sites by slug" is dangerous if it allows listing.
-- Supabase RLS applies to ALL selects.

-- Let's try to restrict the public policy. 
-- Ideally, we only allow selecting if the user is NOT trying to list everything. 
-- But Postgres RLS doesn't know the "intent".

-- ALTERNATIVE: 
-- We can keep the public policy, BUT we MUST update the Dashboard query to explicitly filter by `user_id`.
-- However, that doesn't prevent a malicious user from listing all sites.

-- REAL FIX:
-- We need to allow public access ONLY to specific columns? No, we need the data.
-- We can use a separate function for public access? 
-- Or we can say: Public access is allowed, but maybe we can distinguish "published" sites?
-- For now, the simplest fix to prevent the *UI* issue is to update the Dashboard query.
-- BUT to fix the *Security* issue (listing all sites), we need to be smarter.

-- Let's assume for this "Digital Business Card" app, public profiles ARE public. 
-- So listing them might not be a "breach" per se, but it breaks the UI.
-- The UI issue is that `fetchSites` returns everything.

-- Let's update the DashboardLayout.tsx to explicitly filter by user_id.
-- AND let's try to make the RLS policy strictly for "published" sites if we had a published flag.
-- Since we don't, let's just fix the UI first by enforcing the filter in the query.

-- WAIT! The user said "I again get the same dashboard as Karim Yahia!".
-- This implies they see Karim's data.
-- If I update DashboardLayout.tsx, it fixes the UI.
-- But the user asked to "fix the database" earlier.

-- Let's look at `schema.sql` again.
-- `create policy "Public can view sites by slug" on sites for select using ( true );`
-- This is indeed the culprit. It makes all sites public.

-- If we want to allow public access to cards, we usually do it via a separate API or a function that takes a slug.
-- OR we accept that `select * from sites` returns everything, and we MUST filter in the client.
-- BUT `select * from sites` returning everything is bad for performance and privacy.

-- PROPOSED FIX:
-- 1. Drop the "Public can view sites by slug" policy.
-- 2. Create a SECURITY DEFINER function `get_site_by_slug(slug_input text)` that bypasses RLS to fetch a single site.
-- 3. Grant execute on this function to public/anon.
-- 4. Then the frontend uses `.rpc('get_site_by_slug', { slug_input: '...' })` for the public view.
-- 5. The `sites` table remains locked down to `auth.uid() = user_id` for direct selects.

-- This is the most secure and robust way.

CREATE OR REPLACE FUNCTION get_site_by_slug(slug_input text)
RETURNS SETOF sites
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM sites WHERE slug = slug_input;
$$;

DROP POLICY IF EXISTS "Public can view sites by slug" ON public.sites;
