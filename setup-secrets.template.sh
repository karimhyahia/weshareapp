#!/bin/bash
# WeShare Supabase Secrets Setup - TEMPLATE
#
# ANLEITUNG:
# 1. Kopiere diese Datei: cp setup-secrets.template.sh setup-secrets.sh
# 2. Ersetze die Platzhalter in setup-secrets.sh mit deinen echten Keys
# 3. Führe aus: ./setup-secrets.sh
#
# WICHTIG: setup-secrets.sh ist in .gitignore und wird NICHT committed!

echo "🚀 Setting up Supabase Secrets for WeShare..."
echo ""

# 1. Stripe Secret Key (von Stripe Dashboard)
echo "📝 Setting STRIPE_SECRET_KEY..."
supabase secrets set STRIPE_SECRET_KEY=sk_test_DEIN_STRIPE_SECRET_KEY_HIER

# 2. Supabase URL
echo "📝 Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=https://DEIN-PROJECT-REF.supabase.co

# 3. Supabase Service Role Key (von Supabase Dashboard → Settings → API)
echo "📝 Setting SUPABASE_SERVICE_ROLE_KEY..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=DEIN_SERVICE_ROLE_KEY_HIER

echo ""
echo "✅ All secrets have been set!"
echo ""
echo "Next steps:"
echo "1. Run migrations (see SETUP_BEFEHLE.md)"
echo "2. Deploy Edge Functions: supabase functions deploy stripe-checkout stripe-webhook"
echo "3. Configure Stripe webhook"
echo "4. Test with: npm run dev"
