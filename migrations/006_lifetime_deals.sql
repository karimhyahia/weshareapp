-- Migration 006: Convert to Lifetime Deals (One-Time Payments)
-- Run this AFTER migration 005 to convert to lifetime deal model

-- 1. Add lifetime pricing columns to subscription_tiers
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS price_lifetime numeric DEFAULT 0;

-- 2. Update existing tiers with lifetime pricing
UPDATE public.subscription_tiers SET price_lifetime = 89, name = 'Pro LTD' WHERE id = 'pro';
UPDATE public.subscription_tiers SET price_lifetime = 249, name = 'Business LTD' WHERE id = 'business';
UPDATE public.subscription_tiers SET price_lifetime = 0 WHERE id = 'free';

-- 3. Update subscription table to support lifetime purchases
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS purchased_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

-- Allow 'lifetime' status
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'lifetime'));

-- 4. Add tier_id to payment_history for better tracking
ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS tier_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- 5. Update get_user_subscription function for lifetime deals
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  tier_id text,
  tier_name text,
  status text,
  purchased_at timestamp with time zone,
  amount_paid numeric,
  features jsonb,
  limits jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.tier_id,
    t.name,
    s.status,
    s.purchased_at,
    s.amount_paid,
    t.features,
    t.limits
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid;
$$;

-- 6. Update has_feature_access to include 'lifetime' status
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid uuid, feature_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_features jsonb;
  user_status text;
BEGIN
  SELECT features, status INTO user_features, user_status
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid;

  IF user_features IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has active or lifetime status
  IF user_status NOT IN ('active', 'lifetime') THEN
    RETURN false;
  END IF;

  RETURN COALESCE((user_features->feature_key)::boolean, false);
END;
$$;

-- 7. Make billing_cycle optional (not needed for lifetime deals)
ALTER TABLE public.subscriptions
  ALTER COLUMN billing_cycle DROP NOT NULL;

-- 8. Add index for purchased_at for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_purchased_at ON subscriptions(purchased_at);

COMMENT ON COLUMN subscription_tiers.price_lifetime IS 'One-time payment price for lifetime access';
COMMENT ON COLUMN subscriptions.purchased_at IS 'When the lifetime deal was purchased';
COMMENT ON COLUMN subscriptions.amount_paid IS 'Amount paid for lifetime access';
