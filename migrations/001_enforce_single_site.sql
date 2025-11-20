-- Migration: Enforce Single Site Per User
-- Run this script in your Supabase SQL Editor

-- 1. Clean up duplicates: Keep only the most recently updated site for each user
-- This deletes all sites for a user EXCEPT the one with the latest updated_at timestamp.
DELETE FROM sites
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as r_num
    FROM sites
  ) t
  WHERE t.r_num = 1
);

-- 2. Add unique constraint to user_id
-- This ensures that the database will reject any attempt to create a second site for a user.
ALTER TABLE sites
ADD CONSTRAINT unique_user_site UNIQUE (user_id);
