-- Migration 005: Add Subscriptions and Payment Support
-- This migration adds tables for managing subscriptions with Stripe

-- 1. Create subscription_tiers table (reference data)
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  features jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb, -- e.g., {"max_cards": 5, "max_links": 100}
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default tiers
INSERT INTO public.subscription_tiers (id, name, price_monthly, price_yearly, features, limits) VALUES
  ('free', 'Free', 0, 0,
    '{"basic_analytics": true, "standard_themes": true, "qr_code": true}'::jsonb,
    '{"max_cards": 1, "max_links": 3, "analytics_days": 7, "qr_scans_monthly": 100}'::jsonb),
  ('pro', 'Pro', 9.99, 99,
    '{"advanced_analytics": true, "all_themes": true, "custom_colors": true, "remove_branding": true, "lead_collection": true, "priority_support": true, "video_integration": true}'::jsonb,
    '{"max_cards": 999, "max_links": 999, "analytics_days": 999999, "qr_scans_monthly": 999999, "storage_gb": 5}'::jsonb),
  ('business', 'Business', 29.99, 299,
    '{"all_pro_features": true, "team_management": true, "api_access": true, "custom_domain": true, "crm_integrations": true, "white_label": true, "dedicated_support": true}'::jsonb,
    '{"max_cards": 999, "max_links": 999, "team_members": 5, "analytics_days": 999999, "qr_scans_monthly": 999999, "storage_gb": 50}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier_id text REFERENCES public.subscription_tiers(id) DEFAULT 'free' NOT NULL,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'eur' NOT NULL,
  status text NOT NULL, -- succeeded, failed, pending, refunded
  description text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 4. Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for subscription_tiers (public read)
CREATE POLICY "Subscription tiers are viewable by everyone"
  ON subscription_tiers FOR SELECT
  USING (true);

-- 6. RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. RLS Policies for payment_history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Public can insert payments (for webhook processing)
CREATE POLICY "System can insert payment history"
  ON payment_history FOR INSERT
  WITH CHECK (true);

-- 8. Create function to get user's current subscription with tier details
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  tier_id text,
  tier_name text,
  status text,
  billing_cycle text,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean,
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
    s.billing_cycle,
    s.current_period_end,
    s.cancel_at_period_end,
    t.features,
    t.limits
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid;
$$;

-- 9. Create function to check if user has feature access
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid uuid, feature_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_features jsonb;
BEGIN
  SELECT features INTO user_features
  FROM subscriptions s
  JOIN subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = user_uuid AND s.status = 'active';

  IF user_features IS NULL THEN
    RETURN false;
  END IF;

  RETURN (user_features->feature_key)::boolean = true;
END;
$$;

-- 10. Create trigger to auto-create free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier_id, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_default_subscription();

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- 12. Add updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
