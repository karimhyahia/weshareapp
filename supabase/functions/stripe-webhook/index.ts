import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      // Keep subscription handlers for future if you want to add them
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tierId = session.metadata?.tier_id;

  if (!userId || !tierId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const customerId = session.customer as string;
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

  console.log(`Checkout completed for user ${userId}, tier ${tierId}, amount €${amountTotal}`);

  // For one-time payments (Lifetime Deals)
  if (session.mode === 'payment') {
    const paymentIntentId = session.payment_intent as string;

    // Update subscription to lifetime status
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier_id: tierId,
        status: 'lifetime',
        stripe_customer_id: customerId,
        purchased_at: new Date().toISOString(),
        amount_paid: amountTotal,
        billing_cycle: null, // Not needed for lifetime deals
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log(`Lifetime access granted to user ${userId} for tier ${tierId}`);
    }

    // Record payment
    await recordPayment(userId, paymentIntentId, session.id, amountTotal, tierId, 'succeeded');
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  const tierId = paymentIntent.metadata?.tier_id;

  if (!userId) {
    console.error('No user_id in payment intent metadata');
    return;
  }

  console.log(`Payment succeeded for user ${userId}`);

  // Already handled in checkout.session.completed, but log for safety
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  const tierId = paymentIntent.metadata?.tier_id;

  if (!userId) {
    console.error('No user_id in failed payment intent');
    return;
  }

  console.log(`Payment failed for user ${userId}`);

  // Record failed payment
  await recordPayment(
    userId,
    paymentIntent.id,
    null,
    paymentIntent.amount / 100,
    tierId || 'unknown',
    'failed'
  );

  // TODO: Send email notification to user about failed payment
}

async function recordPayment(
  userId: string,
  paymentIntentId: string,
  checkoutSessionId: string | null,
  amount: number,
  tierId: string,
  status: string
) {
  // Get subscription
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  // Record payment in history
  const { error } = await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      subscription_id: subData?.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: checkoutSessionId,
      amount: amount,
      currency: 'eur',
      status: status,
      tier_id: tierId,
      description: `Lifetime access to ${tierId} tier`,
    });

  if (error) {
    console.error('Error recording payment:', error);
  } else {
    console.log(`Payment recorded for user ${userId}: €${amount} (${status})`);
  }
}

// Keep these for potential future subscription features
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  console.log(`Subscription ${subscription.status} for user ${userId}`);
  // Implementation for recurring subscriptions if needed later
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  console.log(`Subscription deleted for user ${userId}`);
  // Implementation for recurring subscriptions if needed later
}
