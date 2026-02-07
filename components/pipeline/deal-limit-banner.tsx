'use client';

import { useState } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { PricingModal } from '@/components/billing/pricing-modal';

export function DealLimitBanner({ used, limit }: { used: number; limit: number }) {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          You&apos;ve used <span className="font-semibold">{used}/{limit}</span> free deals. Upgrade for unlimited.
        </p>
        <button
          onClick={() => setShowPricing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors flex-shrink-0"
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </button>
      </div>

      {showPricing && (
        <PricingModal
          currentTier="free"
          onClose={() => setShowPricing(false)}
        />
      )}
    </>
  );
}
