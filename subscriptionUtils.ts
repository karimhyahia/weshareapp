import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { SubscriptionTier, SubscriptionTierId, UserSubscription } from './types';

// Initialize Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Lifetime Deal Tiers Configuration
// NOTE: Update stripe_price_id values from your Stripe Dashboard after creating products
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLifetime: 0,
    stripePriceId: undefined,
    features: {
      // Core Features
      digitalCards: true,
      socialLinks: true,
      qrCode: true,
      standardThemes: true,
      basicAnalytics: true,
      profileCustomization: true,

      // Advanced Features (NOT included in Free)
      customColors: false,
      customFonts: false,
      allThemes: false,
      removeBranding: false,
      advancedAnalytics: false,
      contactForm: false,
      leadCollection: false,
      services: false,
      projects: false,
      videoIntegration: false,
      voiceIntro: false,
      customDomain: false,
      prioritySupport: false,
      apiAccess: false,
      teamManagement: false,
      whiteLabel: false,
      dedicatedSupport: false,
      bulkOperations: false,
      exportData: false,
      lifetimeAccess: false,
    },
    limits: {
      maxCards: 1,
      maxLinks: 3,
      analyticsDays: 7,
      qrScansMonthly: 100,
      maxServices: 2,
      maxProjects: 2,
      contactForm: false,
      storageGb: 0.1, // 100MB
    },
  },
  {
    id: 'pro',
    name: 'Pro LTD',
    priceLifetime: 89,
    stripePriceId: 'price_1SXJTN2EeXK7mLiF7sYKU680', // Pro Lifetime Deal
    features: {
      // Core Features
      digitalCards: true,
      socialLinks: true,
      qrCode: true,
      standardThemes: true,
      basicAnalytics: true,
      profileCustomization: true,

      // Pro Features
      customColors: true,
      customFonts: true,
      allThemes: true,
      removeBranding: true,
      advancedAnalytics: true,
      contactForm: true,
      leadCollection: true,
      services: true,
      projects: true,
      videoIntegration: true,
      voiceIntro: true,
      customDomain: true,
      prioritySupport: true,
      exportData: true,
      lifetimeAccess: true,

      // Business Features (NOT included in Pro)
      apiAccess: false,
      teamManagement: false,
      whiteLabel: false,
      dedicatedSupport: false,
      bulkOperations: false,
    },
    limits: {
      maxCards: 5,
      maxLinks: 999,
      analyticsDays: 999999, // Forever
      qrScansMonthly: 999999, // Unlimited
      maxServices: 10,
      maxProjects: 10,
      contactForm: true,
      storageGb: 5,
    },
  },
  {
    id: 'business',
    name: 'Business LTD',
    priceLifetime: 249,
    stripePriceId: 'price_1SXJUo2EeXK7mLiFDCXcvhXw', // Business Lifetime Deal
    features: {
      // Core Features
      digitalCards: true,
      socialLinks: true,
      qrCode: true,
      standardThemes: true,
      basicAnalytics: true,
      profileCustomization: true,

      // Pro Features
      customColors: true,
      customFonts: true,
      allThemes: true,
      removeBranding: true,
      advancedAnalytics: true,
      contactForm: true,
      leadCollection: true,
      services: true,
      projects: true,
      videoIntegration: true,
      voiceIntro: true,
      customDomain: true,
      prioritySupport: true,
      exportData: true,
      lifetimeAccess: true,

      // Business Features
      apiAccess: true,
      teamManagement: true,
      whiteLabel: true,
      dedicatedSupport: true,
      bulkOperations: true,
      unlimitedEverything: true,
    },
    limits: {
      maxCards: 999999, // Unlimited
      maxLinks: 999999, // Unlimited
      analyticsDays: 999999, // Forever
      qrScansMonthly: 999999, // Unlimited
      maxServices: 999, // Unlimited
      maxProjects: 999, // Unlimited
      contactForm: true,
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

    console.log('Raw subscription data from database:', data);

    // Map snake_case to camelCase if needed
    if (data && (data as any).tier_id) {
      return {
        subscriptionId: (data as any).subscription_id,
        tierId: (data as any).tier_id,
        tierName: (data as any).tier_name,
        status: (data as any).status,
        purchasedAt: (data as any).purchased_at,
        amountPaid: (data as any).amount_paid,
        features: (data as any).features,
        limits: (data as any).limits,
      } as UserSubscription;
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
 * Create Stripe checkout session for one-time payment
 */
export async function createCheckoutSession(
  tierId: SubscriptionTierId
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
    if (!tier || !tier.stripePriceId) {
      return { success: false, error: 'Invalid tier or price ID not configured. Please update subscriptionUtils.ts with your Stripe price IDs.' };
    }

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId: tier.stripePriceId,
        userId: user.id,
        email: user.email,
        tierId,
        mode: 'payment', // One-time payment
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
 * Get price display string
 */
export function getPriceDisplay(tier: SubscriptionTier): string {
  if (tier.id === 'free') return 'Kostenlos';
  return `€${tier.priceLifetime} einmalig`;
}

/**
 * Get subscription status badge color
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active':
    case 'lifetime':
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

/**
 * Calculate what users save vs monthly equivalent
 */
export function getLifetimeSavings(tier: SubscriptionTier): string {
  if (tier.id === 'free') return '';

  // Assuming monthly equivalent would be ~€10-30/month
  const monthlyEquivalent = tier.id === 'pro' ? 9.99 : 29.99;
  const monthsBreakEven = Math.ceil(tier.priceLifetime / monthlyEquivalent);

  return `Zahlt sich nach ${monthsBreakEven} Monaten ab`;
}

/**
 * Check if user can create a new card
 */
export async function canCreateCard(currentCardCount: number): Promise<{ allowed: boolean; limit: number; message?: string }> {
  const subscription = await getUserSubscription();
  if (!subscription) {
    return { allowed: false, limit: 0, message: 'No subscription found' };
  }

  const tier = getSubscriptionTier(subscription.tierId);
  if (!tier) {
    return { allowed: false, limit: 0, message: 'Invalid subscription tier' };
  }

  const maxCards = tier.limits.maxCards || 1;
  const allowed = currentCardCount < maxCards;

  return {
    allowed,
    limit: maxCards,
    message: allowed ? undefined : `You've reached your limit of ${maxCards} card${maxCards > 1 ? 's' : ''}. Upgrade to create more!`,
  };
}

/**
 * Get usage stats for current subscription
 */
export async function getUsageStats(currentCardCount: number) {
  const subscription = await getUserSubscription();
  if (!subscription) return null;

  const tier = getSubscriptionTier(subscription.tierId);
  if (!tier) return null;

  return {
    cards: {
      used: currentCardCount,
      limit: tier.limits.maxCards || 1,
      percentage: tier.limits.maxCards ? Math.round((currentCardCount / tier.limits.maxCards) * 100) : 0,
      unlimited: tier.limits.maxCards >= 999999,
    },
    links: {
      limit: tier.limits.maxLinks || 5,
      unlimited: tier.limits.maxLinks >= 999,
    },
    services: {
      limit: tier.limits.maxServices || 0,
      allowed: (tier.limits.maxServices || 0) > 0,
    },
    projects: {
      limit: tier.limits.maxProjects || 0,
      allowed: (tier.limits.maxProjects || 0) > 0,
    },
    contactForm: {
      allowed: tier.limits.contactForm || false,
    },
  };
}
