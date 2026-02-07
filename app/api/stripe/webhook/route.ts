import { NextResponse } from 'next/server';
import { stripe, getTierFromPriceId } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId || !session.subscription) break;

        // Fetch the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const tier = getTierFromPriceId(priceId);
        if (!tier) break;

        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', userId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const tier = getTierFromPriceId(priceId);
        if (!tier) break;

        // Only update if subscription is active or trialing
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await supabase
            .from('users')
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscription.id,
            })
            .eq('id', user.id);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
          })
          .eq('id', user.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Log but don't downgrade — Stripe handles retries
        console.warn(`Payment failed for customer ${customerId}, invoice ${invoice.id}`);

        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
