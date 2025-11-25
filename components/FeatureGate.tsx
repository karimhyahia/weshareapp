import React, { useState, useEffect } from 'react';
import { Crown, Lock } from 'lucide-react';
import { hasFeatureAccess, getUserSubscription } from '../subscriptionUtils';
import { Button } from './ui/Button';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

/**
 * FeatureGate component - restricts features based on subscription tier
 *
 * Usage:
 * <FeatureGate feature="customColors" onUpgrade={() => setShowUpgradeModal(true)}>
 *   <ColorPicker />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  onUpgrade,
  children,
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    setLoading(true);
    const access = await hasFeatureAccess(feature);
    setHasAccess(access);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-200 rounded-lg h-20"></div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state UI
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none blur-sm opacity-40">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-700/80 rounded-lg backdrop-blur-sm">
        <div className="text-center text-white p-6">
          <Crown size={48} className="mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
          <p className="text-slate-200 mb-4 text-sm">
            Upgrade to Pro to unlock this feature
          </p>
          {onUpgrade && (
            <Button variant="primary" onClick={onUpgrade}>
              <Lock size={16} className="mr-2" />
              Upgrade Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * UsageLimitGuard - checks if user is within usage limits
 *
 * Usage:
 * <UsageLimitGuard limitType="cards" onLimitReached={() => alert('Limit reached!')}>
 *   <CreateCardButton />
 * </UsageLimitGuard>
 */
interface UsageLimitGuardProps {
  limitType: 'cards' | 'links';
  onLimitReached?: (current: number, max: number) => void;
  children: (props: { isWithinLimit: boolean; current: number; max: number }) => React.ReactNode;
}

export const UsageLimitGuard: React.FC<UsageLimitGuardProps> = ({
  limitType,
  onLimitReached,
  children,
}) => {
  const [limit, setLimit] = useState({ isWithinLimit: true, current: 0, max: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLimit();
  }, [limitType]);

  const checkLimit = async () => {
    setLoading(true);
    const subscription = await getUserSubscription();

    if (subscription) {
      // Check current usage
      const usage = await checkUsage(limitType, subscription);
      setLimit(usage);

      if (!usage.isWithinLimit && onLimitReached) {
        onLimitReached(usage.current, usage.max);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse bg-slate-200 rounded-lg h-10"></div>;
  }

  return <>{children(limit)}</>;
};

// Helper to check usage
async function checkUsage(
  limitType: 'cards' | 'links',
  subscription: any
): Promise<{ isWithinLimit: boolean; current: number; max: number }> {
  // This would integrate with your actual usage tracking
  // For now, returning mock data
  return { isWithinLimit: true, current: 0, max: subscription.limits.maxCards };
}

/**
 * SubscriptionBadge - displays user's current tier
 */
export const SubscriptionBadge: React.FC = () => {
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const sub = await getUserSubscription();
    setSubscription(sub);
  };

  if (!subscription || subscription.tierId === 'free') {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
      <Crown size={14} />
      <span>{subscription.tierName}</span>
    </div>
  );
};
