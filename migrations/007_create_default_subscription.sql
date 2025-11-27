-- Migration 007: Create default subscription for new users
-- This ensures every new user gets a 'free' tier subscription automatically

-- 1. Drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Update handle_new_user function to create both profile AND subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  -- Create default 'free' tier subscription
  INSERT INTO public.subscriptions (user_id, tier_id, status)
  VALUES (new.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;  -- In case subscription already exists

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill existing users without subscriptions
-- This ensures all existing users who don't have a subscription get the free tier
INSERT INTO public.subscriptions (user_id, tier_id, status)
SELECT au.id, 'free', 'active'
FROM auth.users au
LEFT JOIN public.subscriptions s ON au.id = s.user_id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and free subscription for new users';
