# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for WeShare.

## 📋 Prerequisites

- Stripe account ([sign up at stripe.com](https://stripe.com))
- Supabase project with Edge Functions enabled
- Node.js and npm installed

---

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install `@stripe/stripe-js` and other required packages.

---

### 2. Create Stripe Products & Prices

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add product**

#### Create Pro Plan Product

**Product Details:**
- Name: `WeShare Pro`
- Description: `Premium digital business card features`

**Pricing:**
- Create two prices for this product:
  - **Monthly**: €9.99/month (recurring)
  - **Yearly**: €99/year (recurring)

**Save the Price IDs** (they look like `price_xxxxx`)

#### Create Business Plan Product

**Product Details:**
- Name: `WeShare Business`
- Description: `Advanced features for teams and businesses`

**Pricing:**
- Create two prices:
  - **Monthly**: €29.99/month (recurring)
  - **Yearly**: €299/year (recurring)

**Save the Price IDs**

---

### 3. Update Price IDs in Code

Open `subscriptionUtils.ts` and update the Stripe price IDs:

```typescript
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  // ... free tier ...
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9.99,
    priceYearly: 99,
    stripePriceIdMonthly: 'price_YOUR_PRO_MONTHLY_ID', // ← Update this
    stripePriceIdYearly: 'price_YOUR_PRO_YEARLY_ID',   // ← Update this
    // ...
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 29.99,
    priceYearly: 299,
    stripePriceIdMonthly: 'price_YOUR_BUSINESS_MONTHLY_ID', // ← Update this
    stripePriceIdYearly: 'price_YOUR_BUSINESS_YEARLY_ID',   // ← Update this
    // ...
  },
];
```

---

### 4. Configure Environment Variables

#### Frontend (.env.local)

Create or update `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx  # ← Add this
```

Get your Stripe publishable key from: [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)

#### Supabase Edge Functions

Set secrets in Supabase for Edge Functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx  # We'll get this later
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note:** Use test keys (starting with `sk_test_`) for development, and live keys (starting with `sk_live_`) for production.

---

### 5. Run Database Migration

1. Open [Supabase Dashboard → SQL Editor](https://app.supabase.com)
2. Open the file `migrations/005_add_subscriptions.sql`
3. Copy the entire contents
4. Paste into SQL Editor and click **Run**

This creates:
- `subscription_tiers` table
- `subscriptions` table
- `payment_history` table
- RLS policies
- Helper functions
- Triggers for new users

**Verify:** Check that the tables appear in the Table Editor.

---

### 6. Deploy Supabase Edge Functions

```bash
# Deploy stripe-checkout function
supabase functions deploy stripe-checkout

# Deploy stripe-portal function
supabase functions deploy stripe-portal

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

**Verify:** Functions should appear in your Supabase Dashboard under Edge Functions.

---

### 7. Configure Stripe Webhooks

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**

**Endpoint URL:**
```
https://your-project-ref.supabase.co/functions/v1/stripe-webhook
```

Replace `your-project-ref` with your actual Supabase project reference.

**Events to listen for:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

3. Click **Add endpoint**
4. **Copy the Webhook Signing Secret** (starts with `whsec_`)
5. Update Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

### 8. Enable Stripe Customer Portal

The Customer Portal allows users to manage their subscriptions, update payment methods, and view invoices.

1. Go to [Stripe Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Click **Activate test link** (or **Activate** for production)
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing info
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans (optional)

---

### 9. Test the Integration

#### Test Mode

Stripe provides test card numbers:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment requires authentication:**
- Card: `4000 0025 0000 3155`

**Declined payment:**
- Card: `4000 0000 0000 9995`

#### Testing Flow

1. Start your dev server: `npm run dev`
2. Sign up for a new account
3. Click "Upgrade" or go to Pricing page
4. Select Pro or Business plan
5. Click "Start 14-Day Free Trial"
6. Use test card `4242 4242 4242 4242`
7. Complete checkout
8. Verify you're redirected back to the app
9. Check your subscription status in the Dashboard

#### Verify in Stripe Dashboard

- Go to [Customers](https://dashboard.stripe.com/test/customers) - you should see your test customer
- Go to [Subscriptions](https://dashboard.stripe.com/test/subscriptions) - you should see the active subscription
- Go to [Webhooks](https://dashboard.stripe.com/test/webhooks) - check webhook logs to ensure events are being received

#### Verify in Supabase

1. Open Supabase Dashboard → Table Editor
2. Check `subscriptions` table - should have a row with your user_id and tier_id = 'pro' or 'business'
3. Check `payment_history` table - should have payment records

---

### 10. Production Deployment

When ready for production:

#### Switch to Live Mode in Stripe

1. Toggle Stripe Dashboard from "Test mode" to "Live mode" (top-right)
2. Get your live API keys:
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`)

#### Update Environment Variables

**Frontend:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
```

**Supabase Secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
```

#### Create Live Webhook

1. Create a new webhook endpoint in **Live mode**
2. Use the same URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Add the same events
4. Copy the **Live** webhook secret
5. Update Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

#### Activate Live Customer Portal

Go to [Stripe Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal) and click **Activate** for live mode.

---

## 🎨 Customization

### Adjust Pricing

To change pricing, update both:

1. **Stripe Dashboard**: Edit product prices
2. **Code**: Update `subscriptionUtils.ts`:

```typescript
{
  id: 'pro',
  name: 'Pro',
  priceMonthly: 14.99,  // ← Update these
  priceYearly: 149,     // ← Update these
  stripePriceIdMonthly: 'price_new_id', // ← Update with new Stripe price ID
  stripePriceIdYearly: 'price_new_id',  // ← Update with new Stripe price ID
  // ...
}
```

### Add New Features to Tiers

Update `subscriptionUtils.ts`:

```typescript
features: {
  basicAnalytics: true,
  advancedAnalytics: true,
  customFeature: true,  // ← Add new feature
  // ...
},
```

Then check access in your code:

```typescript
import { hasFeatureAccess } from './subscriptionUtils';

const hasCustomFeature = await hasFeatureAccess('customFeature');
if (hasCustomFeature) {
  // Show feature
}
```

---

## 🔧 Troubleshooting

### Issue: "Stripe not configured" error

**Solution:** Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env.local` and restart dev server.

### Issue: Checkout doesn't redirect

**Solution:**
1. Check browser console for errors
2. Verify Stripe publishable key is correct
3. Ensure Edge Functions are deployed
4. Check Supabase logs: Dashboard → Edge Functions → stripe-checkout → Logs

### Issue: Webhook events not received

**Solution:**
1. Verify webhook URL is correct in Stripe Dashboard
2. Check webhook signing secret is set: `supabase secrets list`
3. Test webhook: Stripe Dashboard → Webhooks → Click your endpoint → Send test webhook
4. Check Supabase logs: Dashboard → Edge Functions → stripe-webhook → Logs

### Issue: Subscription not updating in database

**Solution:**
1. Check webhook logs in Stripe Dashboard
2. Check Supabase function logs for errors
3. Verify RLS policies allow updates
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Issue: "Price ID not configured" error

**Solution:** Update `stripePriceIdMonthly` and `stripePriceIdYearly` in `subscriptionUtils.ts` with actual Stripe price IDs.

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

## 🔐 Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Use webhook signing** - Always verify webhook signatures
3. **Validate on server** - Never trust client-side data
4. **Use HTTPS** - Always in production
5. **Monitor logs** - Regularly check Stripe and Supabase logs
6. **Set up alerts** - Configure Stripe email notifications for failed payments

---

## 💡 Next Steps

After completing setup:

1. **Test thoroughly** with Stripe test cards
2. **Add upgrade prompts** throughout your app
3. **Implement feature restrictions** based on subscription tier
4. **Set up email notifications** for subscription events
5. **Create cancellation flow** with feedback collection
6. **Add billing page** to show invoices and payment history

---

## ✅ Setup Checklist

- [ ] Stripe account created
- [ ] Products and prices created in Stripe
- [ ] Price IDs updated in `subscriptionUtils.ts`
- [ ] Environment variables configured
- [ ] Database migration run successfully
- [ ] Edge Functions deployed
- [ ] Webhook endpoint configured
- [ ] Webhook secret set in Supabase
- [ ] Customer Portal activated
- [ ] Test subscription completed successfully
- [ ] Subscription visible in database
- [ ] Webhook events being received

---

**Questions or issues?** Check the troubleshooting section or review Stripe/Supabase logs for errors.

**Ready to launch?** Don't forget to switch to live mode and update all keys!
