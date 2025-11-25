import React, { useState, useEffect } from 'react';
import { UserSubscription, SubscriptionTier } from '../types';
import {
  getUserSubscription,
  openCustomerPortal,
  SUBSCRIPTION_TIERS,
  getStatusBadgeColor,
} from '../subscriptionUtils';
import { Button } from './ui/Button';
import { CreditCard, Calendar, AlertCircle, CheckCircle2, Crown } from 'lucide-react';

interface SubscriptionManagerProps {
  onUpgrade?: () => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ onUpgrade }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const sub = await getUserSubscription();
      setSubscription(sub);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setError(null);
    const result = await openCustomerPortal();
    if (!result.success) {
      setError(result.error || 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Subscription Found</h3>
          <p className="text-slate-600 mb-4">Unable to load your subscription information.</p>
          <Button onClick={loadSubscription}>Retry</Button>
        </div>
      </div>
    );
  }

  const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tierId);
  const isFree = subscription.tierId === 'free';
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={24} />
                <h2 className="text-2xl font-bold">{tier?.name} Plan</h2>
              </div>
              <p className="text-slate-300">
                {isFree ? 'Free forever' : `Billed ${subscription.billingCycle}`}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusBadgeColor(subscription.status)}`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Messages */}
          {subscription.status === 'trialing' && subscription.trialEnd && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-900">Free Trial Active</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-yellow-900">Subscription Ending</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {subscription.status === 'past_due' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-900">Payment Failed</p>
                <p className="text-sm text-red-700 mt-1">
                  Please update your payment method to continue using premium features
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          {!isFree && subscription.currentPeriodEnd && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={18} />
                <span>Next billing date:</span>
                <span className="font-medium text-slate-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Features List */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3">Your Plan Includes:</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  {subscription.limits.maxCards === 999 ? 'Unlimited' : subscription.limits.maxCards} Digital Cards
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  {subscription.limits.maxLinks === 999 ? 'Unlimited' : subscription.limits.maxLinks} Social Links
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Analytics ({subscription.limits.analyticsDays > 365 ? 'Unlimited' : `${subscription.limits.analyticsDays} days`})
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  {subscription.limits.qrScansMonthly === 999999 ? 'Unlimited' : subscription.limits.qrScansMonthly} QR Scans/month
                </span>
              </div>
              {subscription.features.removeBranding && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Remove WeShare Branding</span>
                </div>
              )}
              {subscription.features.leadCollection && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Lead Collection Forms</span>
                </div>
              )}
              {subscription.features.customDomain && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Custom Domain</span>
                </div>
              )}
              {subscription.features.prioritySupport && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Priority Support</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {isFree ? (
              <Button variant="primary" className="flex-1" onClick={onUpgrade}>
                <Crown size={18} className="mr-2" />
                Upgrade to Pro
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1" onClick={handleManageSubscription}>
                <CreditCard size={18} className="mr-2" />
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {isFree && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to unlock more?</h3>
          <p className="text-blue-100 mb-6">
            Upgrade to Pro and get unlimited cards, advanced analytics, lead collection, and more.
          </p>
          <div className="flex gap-4">
            <Button variant="primary" className="bg-white text-blue-600 hover:bg-blue-50" onClick={onUpgrade}>
              View Plans
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
