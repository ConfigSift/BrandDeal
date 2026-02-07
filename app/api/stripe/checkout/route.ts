import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email, name')
      .eq('id', authUser.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        name: userProfile.name || undefined,
        metadata: { user_id: authUser.id },
      });

      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', authUser.id);
    }

    // Create Checkout Session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/settings?canceled=true`,
      metadata: { user_id: authUser.id },
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: authUser.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
