import React, { useState } from 'react';
import { X, Check, XIcon as XMark, Loader2, Sparkles } from 'lucide-react';
import { BillingCycle, SubscriptionTierId } from '../types';
import { createCheckoutSession, SUBSCRIPTION_TIERS, getPriceDisplay, getYearlySavings } from '../subscriptionUtils';
import { Button } from './ui/Button';

interface UpgradePricingModalProps {
  onClose: () => void;
  currentTier?: SubscriptionTierId;
}

export const UpgradePricingModal: React.FC<UpgradePricingModalProps> = ({ onClose, currentTier = 'free' }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tierId: SubscriptionTierId) => {
    if (tierId === 'free' || tierId === currentTier) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession(tierId, billingCycle);
      if (!result.success) {
        setError(result.error || 'Failed to start checkout');
        setLoading(false);
      }
      // If successful, user will be redirected to Stripe Checkout
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          disabled={loading}
        >
          <X size={24} className="text-slate-600" />
        </button>

        {/* Header */}
        <div className="text-center pt-12 pb-8 px-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles size={16} />
            Upgrade Your Account
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Unlock powerful features to grow your network and manage your digital presence
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-slate-300'}`}
              disabled={loading}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly
              <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full ml-2 font-bold">
                SAVE {Math.round((1 - (SUBSCRIPTION_TIERS[1].priceYearly / (SUBSCRIPTION_TIERS[1].priceMonthly * 12))) * 100)}%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 pb-12">
          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SUBSCRIPTION_TIERS.map((tier, index) => {
              const isCurrent = tier.id === currentTier;
              const isPro = tier.id === 'pro';
              const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;
              const monthlyEquivalent = billingCycle === 'yearly' ? (price / 12).toFixed(2) : price;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border-2 p-6 ${
                    isPro
                      ? 'border-blue-500 bg-blue-50/50 shadow-lg transform lg:-translate-y-2'
                      : 'border-slate-200 bg-white'
                  } ${isCurrent ? 'opacity-60' : ''}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                    {tier.id === 'free' ? (
                      <div className="text-4xl font-bold text-slate-900">€0</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-slate-900">
                          €{monthlyEquivalent}
                          <span className="text-lg text-slate-500 font-normal">/mo</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-slate-600 mt-1">
                            €{price} billed annually
                          </p>
                        )}
                      </>
                    )}
                    {tier.id === 'pro' && billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Save €{getYearlySavings(tier)}/year
                      </p>
                    )}
                  </div>

                  <Button
                    variant={isPro ? 'primary' : 'secondary'}
                    className="w-full mb-6"
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading || isCurrent || tier.id === 'free'}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : tier.id === 'free' ? (
                      'Get Started Free'
                    ) : tier.id === 'pro' ? (
                      'Start 14-Day Free Trial'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>

                  {/* Features List */}
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm">
                      <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span>{tier.limits.maxCards === 999 ? 'Unlimited' : tier.limits.maxCards} Digital Cards</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span>{tier.limits.maxLinks === 999 ? 'Unlimited' : tier.limits.maxLinks} Social Links</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      {tier.features.advancedAnalytics ? (
                        <>
                          <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                          <span>Advanced Analytics</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                          <span>Basic Analytics ({tier.limits.analyticsDays} days)</span>
                        </>
                      )}
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span>QR Code Generation</span>
                    </li>
                    {tier.features.allThemes ? (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>All Premium Themes</span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-sm text-slate-400">
                        <XMark size={18} className="shrink-0 mt-0.5" />
                        <span>Premium Themes</span>
                      </li>
                    )}
                    {tier.features.removeBranding ? (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>Remove Branding</span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-sm text-slate-400">
                        <XMark size={18} className="shrink-0 mt-0.5" />
                        <span>Remove Branding</span>
                      </li>
                    )}
                    {tier.features.leadCollection ? (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>Lead Collection Forms</span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-sm text-slate-400">
                        <XMark size={18} className="shrink-0 mt-0.5" />
                        <span>Lead Collection</span>
                      </li>
                    )}
                    {tier.features.prioritySupport && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>Priority Support</span>
                      </li>
                    )}
                    {tier.features.customDomain && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>Custom Domain</span>
                      </li>
                    )}
                    {tier.features.teamManagement && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>Team Management (5 members)</span>
                      </li>
                    )}
                    {tier.features.apiAccess && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span>API Access</span>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Footer Note */}
          <p className="text-center text-sm text-slate-500 mt-8">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
