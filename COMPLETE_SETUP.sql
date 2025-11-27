-- COMPLETE DATABASE SETUP FOR WESHARE
-- Copy and paste this entire script into Supabase SQL Editor
-- This includes the base schema + all migrations

-- =============================================================================
-- PART 1: BASE SCHEMA
-- =============================================================================

-- Clean up existing items
DROP FUNCTION IF EXISTS public.get_site_by_slug(text);
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_tiers CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  email text
);

-- Create sites table
CREATE TABLE public.sites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  internal_name text,
  slug text UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for Sites
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites"
  ON sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  USING (auth.uid() = user_id);

-- Secure function to fetch site by slug
CREATE OR REPLACE FUNCTION get_site_by_slug(slug_input text)
RETURNS SETOF sites
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM sites WHERE slug = slug_input;
$$;

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb
);

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name text,
  email text,
  phone text,
  message text,
  data jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Public can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view analytics for own sites"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = analytics_events.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- RLS Policies for contact_submissions
CREATE POLICY "Public can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view submissions for own sites"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = contact_submissions.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PART 2: SUBSCRIPTION SYSTEM (Migration 005)
-- =============================================================================

-- Create subscription_tiers table
CREATE TABLE public.subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  price_lifetime numeric DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  features jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default tiers
INSERT INTO public.subscription_tiers (id, name, price_monthly, price_yearly, price_lifetime, features, limits) VALUES
  ('free', 'Free', 0, 0, 0,
    '{"basic_analytics": true, "standard_themes": true, "qr_code": true}'::jsonb,
    '{"max_cards": 1, "max_links": 3, "analytics_days": 7, "qr_scans_monthly": 100}'::jsonb),
  ('pro', 'Pro LTD', 9.99, 99, 89,
    '{"advanced_analytics": true, "all_themes": true, "custom_colors": true, "remove_branding": true, "lead_collection": true, "priority_support": true, "video_integration": true}'::jsonb,
    '{"max_cards": 999, "max_links": 999, "analytics_days": 999999, "qr_scans_monthly": 999999, "storage_gb": 5}'::jsonb),
  ('business', 'Business LTD', 29.99, 299, 249,
    '{"all_pro_features": true, "team_management": true, "api_access": true, "custom_domain": true, "crm_integrations": true, "white_label": true, "dedicated_support": true}'::jsonb,
    '{"max_cards": 999, "max_links": 999, "team_members": 5, "analytics_days": 999999, "qr_scans_monthly": 999999, "storage_gb": 50}'::jsonb);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier_id text REFERENCES public.subscription_tiers(id) DEFAULT 'free' NOT NULL,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'lifetime')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamp with time zone,
  purchased_at timestamp with time zone,
  amount_paid numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create payment_history table
CREATE TABLE public.payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  tier_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'eur' NOT NULL,
  status text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Subscription tiers are viewable by everyone"
  ON subscription_tiers FOR SELECT
  USING (true);

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history"
  ON payment_history FOR INSERT
  WITH CHECK (true);

-- Helper functions
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

  IF user_status NOT IN ('active', 'lifetime') THEN
    RETURN false;
  END IF;

  RETURN COALESCE((user_features->feature_key)::boolean, false);
END;
$$;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- PART 3: NEW USER TRIGGER (Migration 007 - Creates Profile + Subscription)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  -- Create default 'free' tier subscription
  INSERT INTO public.subscriptions (user_id, tier_id, status)
  VALUES (new.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_purchased_at ON subscriptions(purchased_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- =============================================================================
-- DONE! Your database is ready.
-- =============================================================================
