/**
 * Stripe Configuration
 * Pricing tiers and product definitions
 */

export type PricingTier = 'free' | 'premium' | 'lifetime';

export interface PricingPlan {
  name: string;
  price: number;
  interval?: 'month' | 'year' | 'one_time';
  stripePriceId?: string;
  ai_queries_daily: number;
  saved_hadith_limit: number;
  features: string[];
}

export const PRICING_TIERS: Record<PricingTier, PricingPlan> = {
  free: {
    name: 'Free',
    price: 0,
    ai_queries_daily: 5,
    saved_hadith_limit: 50,
    features: [
      'Browse all 36,245 hadith',
      'Full-text search',
      '5 AI explanations per day',
      'Save up to 50 hadith',
      'Mobile app access',
    ],
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    ai_queries_daily: Infinity,
    saved_hadith_limit: Infinity,
    features: [
      'Everything in Free',
      'Unlimited AI explanations',
      'Unlimited saved hadith',
      'Offline reading packs',
      'Advanced search filters',
      'Personal collections',
      'Priority support',
    ],
  },
  lifetime: {
    name: 'Lifetime',
    price: 199.99,
    interval: 'one_time',
    stripePriceId: process.env.STRIPE_PRICE_LIFETIME,
    ai_queries_daily: Infinity,
    saved_hadith_limit: Infinity,
    features: [
      'Everything in Premium',
      'Lifetime access',
      'One-time payment',
      'Early access to new features',
      'Exclusive content',
      'Priority support',
    ],
  },
};

/**
 * Get pricing tier details
 */
export function getPricingTier(tier: PricingTier): PricingPlan {
  return PRICING_TIERS[tier];
}

/**
 * Get all pricing tiers for display
 */
export function getAllPricingTiers(): Array<PricingPlan & { tier: PricingTier }> {
  return Object.entries(PRICING_TIERS).map(([tier, plan]) => ({
    tier: tier as PricingTier,
    ...plan,
  }));
}
