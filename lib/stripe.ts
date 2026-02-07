import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  elite_monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
  elite_annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID!,
};

export function getTierFromPriceId(priceId: string): 'pro' | 'elite' | null {
  if (priceId === PRICE_IDS.pro_monthly || priceId === PRICE_IDS.pro_annual) return 'pro';
  if (priceId === PRICE_IDS.elite_monthly || priceId === PRICE_IDS.elite_annual) return 'elite';
  return null;
}
