import React, { useState } from 'react';
import { ArrowLeft, Check, X as XIcon, Loader2, Sparkles, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface UpgradePageProps {
  onBack?: () => void;
}

const LIFETIME_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect to get started',
    price: 0,
    priceId: null,
    badge: null,
    badgeColor: '',
    buttonText: 'Current Plan',
    buttonVariant: 'secondary' as const,
    features: [
      { text: '1 Digital Card', included: true },
      { text: 'Up to 3 Social Links', included: true },
      { text: 'Basic Analytics (7 days)', included: true },
      { text: 'Standard Themes', included: true },
      { text: 'QR Code Generation', included: true },
      { text: 'Premium Themes', included: false },
      { text: 'Custom Colors', included: false },
      { text: 'Remove Branding', included: false },
      { text: 'Lead Collection', included: false },
      { text: 'Advanced Analytics', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro LTD',
    description: 'Lifetime access to all pro features',
    price: 89,
    priceId: 'price_1SXJTN2EeXK7mLiF7sYKU680',
    badge: 'BEST VALUE',
    badgeColor: 'bg-blue-600',
    buttonText: 'Get Pro - €89 Once',
    buttonVariant: 'primary' as const,
    highlight: true,
    features: [
      { text: 'Unlimited Digital Cards', included: true },
      { text: 'Unlimited Social Links', included: true },
      { text: 'Advanced Analytics (Forever)', included: true },
      { text: 'All Premium Themes', included: true },
      { text: 'Custom Colors & Fonts', included: true },
      { text: 'Remove WeShare Branding', included: true },
      { text: 'Lead Collection Forms', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Video Integration', included: true },
      { text: 'Lifetime Updates', included: true, highlight: true },
    ],
  },
  {
    id: 'business',
    name: 'Business LTD',
    description: 'For teams and power users',
    price: 249,
    priceId: 'price_1SXJUo2EeXK7mLiFDCXcvhXw',
    badge: 'UNLIMITED',
    badgeColor: 'bg-purple-600',
    buttonText: 'Get Business - €249 Once',
    buttonVariant: 'primary' as const,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Team Management (5 members)', included: true },
      { text: 'API Access', included: true },
      { text: 'Custom Domain Support', included: true },
      { text: 'CRM Integrations', included: true },
      { text: 'White Label Options', included: true },
      { text: 'Dedicated Support', included: true },
      { text: 'Bulk Creation Tools', included: true },
      { text: 'Advanced Permissions', included: true },
      { text: 'Lifetime Updates', included: true, highlight: true },
    ],
  },
];

export const UpgradePage: React.FC<UpgradePageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planId: string, priceId: string | null) => {
    if (!priceId) return;

    setLoading(planId);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to upgrade');
        setLoading(null);
        return;
      }

      // Call Stripe checkout Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          userId: user.id,
          email: user.email,
          tierId: planId,
          mode: 'payment', // One-time payment for lifetime deals
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
            <Sparkles size={18} />
            Limited Time Offer - Lifetime Access
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6">
            Upgrade to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lifetime</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Pay once, use forever. No subscriptions, no recurring fees. Get unlimited access to all features with our exclusive lifetime deals.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {LIFETIME_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl transform lg:-translate-y-4 scale-105'
                  : 'bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${plan.badgeColor} text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg`}>
                  {plan.badge}
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {plan.id === 'free' ? (
                  <div className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    Free
                  </div>
                ) : (
                  <>
                    <div className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      €{plan.price}
                    </div>
                    <p className={`text-sm mt-2 ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                      One-time payment • Lifetime access
                    </p>
                  </>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => handleUpgrade(plan.id, plan.priceId)}
                disabled={loading !== null || plan.id === 'free'}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all mb-8 ${
                  plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    : plan.id === 'free'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                } ${loading === plan.id ? 'opacity-75' : ''}`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  plan.buttonText
                )}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`flex items-start gap-3 text-sm ${
                      feature.included
                        ? plan.highlight
                          ? 'text-white'
                          : 'text-slate-700'
                        : plan.highlight
                        ? 'text-blue-200'
                        : 'text-slate-400'
                    } ${feature.highlight ? 'font-bold' : ''}`}
                  >
                    {feature.included ? (
                      <Check size={18} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                    ) : (
                      <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                    )}
                    <span>
                      {feature.text}
                      {feature.highlight && plan.id !== 'free' && (
                        <Sparkles size={14} className="inline ml-1" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-700 font-medium">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Why Lifetime? Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Why Choose Lifetime Access?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={32} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Pay Once, Own Forever</h3>
              <p className="text-slate-600 text-sm">
                No monthly fees, no surprises. One payment gives you lifetime access to all features.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">All Future Updates</h3>
              <p className="text-slate-600 text-sm">
                Get access to all future features and improvements at no additional cost.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Risk-Free</h3>
              <p className="text-slate-600 text-sm">
                14-day money-back guarantee. If you're not satisfied, we'll refund you in full.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What does "lifetime" mean?',
                a: 'Lifetime means you pay once and have access forever. As long as WeShare exists, your account will remain active with all the features you purchased.',
              },
              {
                q: 'Will I get future updates?',
                a: 'Yes! All future features and improvements are included at no additional cost. Your lifetime deal covers everything.',
              },
              {
                q: 'Can I upgrade from Pro to Business later?',
                a: 'Yes, you can upgrade anytime. You\'ll only pay the difference between the two plans.',
              },
              {
                q: 'Is there a money-back guarantee?',
                a: 'Absolutely! We offer a 14-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
              },
            ].map((faq, index) => (
              <details key={index} className="bg-white rounded-xl p-6 border-2 border-slate-200">
                <summary className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">
                  {faq.q}
                </summary>
                <p className="text-slate-600 mt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
