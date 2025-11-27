-- Migration 008: Allow Multiple Sites Per User (for Pro/Business tiers)
-- This removes the UNIQUE constraint on user_id to allow multiple sites

-- 1. Drop the UNIQUE constraint on user_id
ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_user_id_key;

-- 2. Create an index for better query performance (since we'll query by user_id often)
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);

-- 3. Add a helper function to check if user can create more sites
CREATE OR REPLACE FUNCTION can_create_site(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_site_count integer;
  max_sites integer;
  user_tier text;
BEGIN
  -- Get user's tier and max_cards limit
  SELECT
    s.tier_id,
    (t.limits->>'max_cards')::integer
  INTO user_tier, max_sites
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid AND s.status IN ('active', 'lifetime');

  -- If no subscription found, return false
  IF user_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Count current sites
  SELECT COUNT(*) INTO current_site_count
  FROM sites
  WHERE user_id = user_uuid;

  -- Check if under limit
  RETURN current_site_count < max_sites;
END;
$$;

-- 4. Add a helper function to get user's site limit info
CREATE OR REPLACE FUNCTION get_site_limit_info(user_uuid uuid)
RETURNS TABLE (
  current_count bigint,
  max_allowed integer,
  tier_id text,
  can_create boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM sites WHERE user_id = user_uuid),
    (t.limits->>'max_cards')::integer,
    s.tier_id,
    can_create_site(user_uuid)
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid AND s.status IN ('active', 'lifetime');
$$;

COMMENT ON FUNCTION can_create_site(uuid) IS 'Check if user can create more sites based on their tier limits';
COMMENT ON FUNCTION get_site_limit_info(uuid) IS 'Get detailed site limit information for a user';
