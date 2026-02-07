import type { SubscriptionTier } from '@/types';

export const FEATURE_GATES = {
  max_active_deals: { free: 3, pro: Infinity, elite: Infinity },
  ai_extraction: { free: false, pro: true, elite: true },
  ai_monthly_credits: { free: 0, pro: 50, elite: Infinity },
  email_intake: { free: false, pro: true, elite: true },
  invoice_templates: { free: 1, pro: Infinity, elite: Infinity },
  calendar_sync: { free: false, pro: true, elite: true },
  brand_portal: { free: false, pro: false, elite: true },
  analytics: { free: false, pro: false, elite: true },
} as const;

export function canUseFeature(tier: SubscriptionTier, feature: keyof typeof FEATURE_GATES): boolean {
  const gate = FEATURE_GATES[feature];
  const value = gate[tier];
  return typeof value === 'boolean' ? value : value > 0;
}

export function getFeatureLimit(tier: SubscriptionTier, feature: keyof typeof FEATURE_GATES): number | boolean {
  return FEATURE_GATES[feature][tier];
}
