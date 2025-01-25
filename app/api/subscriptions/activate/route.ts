import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { nanoid } from 'nanoid';

const BASE_PLAN_FEATURES = [
  'unlimited_notebooks',
  'email_support',
  'basic_ai'
];

const PLUS_PLAN_FEATURES = [
  ...BASE_PLAN_FEATURES,
  'priority_support',
  'advanced_ai',
  'unlimited_storage'
];

export async function POST(req: Request) {
  try {
    const { userId, sessionId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If sessionId is provided, verify the payment with Stripe
    let session;
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
      }
    }

    // Determine plan type from the session or amount
    const amount = session?.amount_total || 0;
    const planType = amount >= 1000 ? 'plus' : 'base';
    const features = planType === 'plus' ? PLUS_PLAN_FEATURES : BASE_PLAN_FEATURES;

    // Create or update subscription
    const subscription = {
      id: nanoid(),
      userId,
      planType: planType as 'base' | 'plus',
      status: 'active' as const,
      features: JSON.stringify(features),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      stripeCustomerId: session?.customer as string,
      stripeSubscriptionId: session?.subscription as string,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(subscriptions).values(subscription);

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { error: 'Error activating subscription' },
      { status: 500 }
    );
  }
} 