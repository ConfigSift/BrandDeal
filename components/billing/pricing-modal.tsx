'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, Check, Sparkles, Zap, Crown, ExternalLink } from 'lucide-react';
import type { SubscriptionTier } from '@/types';

interface PricingModalProps {
  currentTier: SubscriptionTier;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'pro' as const,
    name: 'Pro',
    icon: Zap,
    monthlyPrice: 19,
    annualPrice: 180,
    annualMonthly: 15,
    description: 'For active creators managing multiple brand deals',
    features: [
      'Unlimited deals',
      'AI contract extraction (50/mo)',
      'Email inbox + forwarding',
      'Unlimited invoice templates',
      'Calendar sync',
      'Daily/weekly email digest',
      '14-day free trial',
    ],
    highlight: true,
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    icon: Crown,
    monthlyPrice: 39,
    annualPrice: 360,
    annualMonthly: 30,
    description: 'For top creators and agencies who need everything',
    features: [
      'Everything in Pro',
      'Unlimited AI extractions',
      'Brand portal (coming soon)',
      'Advanced analytics',
      'Priority support',
      'Team collaboration (coming soon)',
      '14-day free trial',
    ],
    highlight: false,
  },
];

const PRICE_ENV_KEYS: Record<string, string> = {
  pro_monthly: 'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
  pro_annual: 'NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID',
  elite_monthly: 'NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID',
  elite_annual: 'NEXT_PUBLIC_STRIPE_ELITE_ANNUAL_PRICE_ID',
};

export function PricingModal({ currentTier, onClose }: PricingModalProps) {
  const [annual, setAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const isPaid = currentTier === 'pro' || currentTier === 'elite';

  const handleSubscribe = async (planId: 'pro' | 'elite') => {
    setLoadingPlan(planId);

    const billingPeriod = annual ? 'annual' : 'monthly';
    const envKey = `${planId}_${billingPeriod}`;
    const priceId = (window as any).__PRICE_IDS__?.[envKey]
      || process.env[`NEXT_PUBLIC_STRIPE_${planId.toUpperCase()}_${billingPeriod.toUpperCase()}_PRICE_ID`]
      || '';

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingPlan(null);
      }
    } catch {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan('manage');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingPlan(null);
      }
    } catch {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-midnight-800">
              {isPaid ? 'Change Plan' : 'Upgrade Your Plan'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isPaid ? 'Switch between plans or manage your subscription' : 'Unlock powerful features for your creator business'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={cn('text-sm font-medium', !annual ? 'text-midnight-800' : 'text-gray-400')}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                annual ? 'bg-brand-500' : 'bg-gray-300'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                annual ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
            <span className={cn('text-sm font-medium', annual ? 'text-midnight-800' : 'text-gray-400')}>
              Annual
            </span>
            {annual && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                Save 20%
              </span>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map(plan => {
              const isCurrent = currentTier === plan.id;
              const PlanIcon = plan.icon;
              const price = annual ? plan.annualMonthly : plan.monthlyPrice;
              const totalAnnual = annual ? plan.annualPrice : null;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-xl border-2 p-6 transition-all',
                    plan.highlight && !isCurrent ? 'border-brand-500 shadow-lg shadow-brand-500/10' : 'border-gray-200',
                    isCurrent && 'border-emerald-400 bg-emerald-50/30'
                  )}
                >
                  {plan.highlight && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      plan.id === 'pro' ? 'bg-brand-50' : 'bg-amber-50'
                    )}>
                      <PlanIcon className={cn(
                        'w-5 h-5',
                        plan.id === 'pro' ? 'text-brand-500' : 'text-amber-500'
                      )} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-midnight-800">{plan.name}</h3>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-midnight-800">${price}</span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                    {totalAnnual && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        ${totalAnnual}/year billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className={cn(
                          'w-4 h-4 flex-shrink-0 mt-0.5',
                          plan.id === 'pro' ? 'text-brand-500' : 'text-amber-500'
                        )} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={loadingPlan === 'manage'}
                      className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {loadingPlan === 'manage' ? 'Opening...' : 'Manage Subscription'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!loadingPlan}
                      className={cn(
                        'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50',
                        plan.highlight
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'bg-midnight-800 text-white hover:bg-midnight-900'
                      )}
                    >
                      {loadingPlan === plan.id ? 'Redirecting...' : isPaid ? `Switch to ${plan.name}` : `Start Free Trial`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Free plan note */}
          {!isPaid && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Free plan includes 3 active deals, basic invoicing, and in-app notifications.
              No credit card required for the 14-day trial.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
