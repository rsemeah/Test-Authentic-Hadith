/**
 * POST /api/subscriptions/checkout
 * Create Stripe checkout session for premium/lifetime subscription
 */

import { PRICING_TIERS } from '@/lib/stripe/config';
import { requireAuth } from '@/lib/utils/auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { tier } = await request.json();

    // Validate tier
    if (tier !== 'premium' && tier !== 'lifetime') {
      return NextResponse.json(
        { error: 'Invalid tier. Must be premium or lifetime' },
        { status: 400 }
      );
    }

    const pricingPlan = PRICING_TIERS[tier];

    if (!pricingPlan.stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this tier' },
        { status: 500 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: pricingPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: tier === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Checkout session creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
