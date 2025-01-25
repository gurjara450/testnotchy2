import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const POST = async (req: Request) => {
  try {
    const { price, quantity = 1, success_url, cancel_url } = await req.json();

    if (!price) {
      return NextResponse.json(
        { error: 'Price is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price,
          quantity,
        },
      ],
      mode: 'payment',
      success_url: success_url || process.env.STRIPE_SUCCESS_URL || '/',
      cancel_url: cancel_url || process.env.STRIPE_CANCEL_URL || '/',
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 