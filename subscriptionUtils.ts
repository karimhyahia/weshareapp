import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { UserSubscription, SubscriptionTier, BillingCycle, SubscriptionTierId } from './types';

// Initialize Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Subscription Tiers Configuration
// NOTE: Update stripe_price_id values from your Stripe Dashboard after creating products
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      basicAnalytics: true,
      standardThemes: true,
      qrCode: true,
    },
    limits: {
      maxCards: 1,
      maxLinks: 3,
      analyticsDays: 7,
      qrScansMonthly: 100,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9.99,
    priceYearly: 99,
    stripePriceIdMonthly: 'price_xxx', // Replace with actual Stripe price ID
    stripePriceIdYearly: 'price_yyy', // Replace with actual Stripe price ID
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      standardThemes: true,
      allThemes: true,
      customColors: true,
      removeBranding: true,
      leadCollection: true,
      prioritySupport: true,
      videoIntegration: true,
    },
    limits: {
      maxCards: 999,
      maxLinks: 999,
      analyticsDays: 999999,
      qrScansMonthly: 999999,
      storageGb: 5,
    },
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 29.99,
    priceYearly: 299,
    stripePriceIdMonthly: 'price_zzz', // Replace with actual Stripe price ID
    stripePriceIdYearly: 'price_www', // Replace with actual Stripe price ID
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      standardThemes: true,
      allThemes: true,
      customColors: true,
      removeBranding: true,
      leadCollection: true,
      prioritySupport: true,
      videoIntegration: true,
      teamManagement: true,
      apiAccess: true,
      customDomain: true,
      crmIntegrations: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
    limits: {
      maxCards: 999,
      maxLinks: 999,
      analyticsDays: 999999,
      qrScansMonthly: 999999,
      storageGb: 50,
      teamMembers: 5,
    },
  },
];

/**
 * Get subscription tier configuration
 */
export function getSubscriptionTier(tierId: SubscriptionTierId): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === tierId);
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('get_user_subscription', { user_uuid: user.id })
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as UserSubscription;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(featureKey: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('has_feature_access', { user_uuid: user.id, feature_key: featureKey });

    if (error) {
      console.error('Error checking feature access:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in hasFeatureAccess:', error);
    return false;
  }
}

/**
 * Check if user is within usage limits
 */
export async function checkUsageLimit(limitType: 'cards' | 'links'): Promise<{ isWithinLimit: boolean; current: number; max: number }> {
  try {
    const subscription = await getUserSubscription();
    if (!subscription) {
      return { isWithinLimit: false, current: 0, max: 0 };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isWithinLimit: false, current: 0, max: 0 };
    }

    if (limitType === 'cards') {
      const { count } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const current = count || 0;
      const max = subscription.limits.maxCards;
      return { isWithinLimit: current < max, current, max };
    }

    // For links, we'd need to check the CardData
    return { isWithinLimit: true, current: 0, max: subscription.limits.maxLinks };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { isWithinLimit: false, current: 0, max: 0 };
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  tierId: SubscriptionTierId,
  billingCycle: BillingCycle
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!stripePromise) {
      return { success: false, error: 'Stripe not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const tier = getSubscriptionTier(tierId);
    if (!tier) {
      return { success: false, error: 'Invalid subscription tier' };
    }

    const priceId = billingCycle === 'monthly'
      ? tier.stripePriceIdMonthly
      : tier.stripePriceIdYearly;

    if (!priceId) {
      return { success: false, error: 'Price ID not configured. Please update subscriptionUtils.ts with your Stripe price IDs.' };
    }

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId,
        userId: user.id,
        email: user.email,
        tierId,
        billingCycle,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    if (stripe && data.sessionId) {
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        return { success: false, error: stripeError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openCustomerPortal(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const subscription = await getUserSubscription();
    if (!subscription) {
      return { success: false, error: 'No subscription found' };
    }

    // Get subscription with Stripe customer ID
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subData?.stripe_customer_id) {
      return { success: false, error: 'No Stripe customer found' };
    }

    // Call Supabase Edge Function to create portal session
    const { data, error } = await supabase.functions.invoke('stripe-portal', {
      body: {
        customerId: subData.stripe_customer_id,
      },
    });

    if (error) {
      console.error('Error creating portal session:', error);
      return { success: false, error: error.message };
    }

    // Redirect to portal
    if (data.url) {
      window.location.href = data.url;
      return { success: true };
    }

    return { success: false, error: 'No portal URL returned' };
  } catch (error: any) {
    console.error('Error in openCustomerPortal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get price display string
 */
export function getPriceDisplay(tier: SubscriptionTier, billingCycle: BillingCycle): string {
  if (tier.id === 'free') return 'Free';

  const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;
  const period = billingCycle === 'monthly' ? '/mo' : '/yr';

  return `€${price}${period}`;
}

/**
 * Calculate savings for yearly billing
 */
export function getYearlySavings(tier: SubscriptionTier): number {
  const monthlyTotal = tier.priceMonthly * 12;
  const yearlySavings = monthlyTotal - tier.priceYearly;
  return Math.round(yearlySavings * 100) / 100;
}

/**
 * Get subscription status badge color
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'bg-green-100 text-green-800';
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800';
    case 'canceled':
    case 'incomplete':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
