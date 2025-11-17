import { Request, Response } from 'express';
import Stripe from 'stripe';
import { UserModel } from '../models/User.js';
import { db } from '../config/database.js';
import { SUBSCRIPTION_TIERS, CREDIT_PACKS, SubscriptionTier } from '../config/tiers.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function createCheckoutSession(req: any, res: Response) {
  const { tier, type = 'subscription' } = req.body;
  const user = req.user;

  try {
    let sessionConfig: any = {
      customer_email: user.email,
      client_reference_id: user.id.toString(),
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    };

    if (type === 'subscription') {
      if (!SUBSCRIPTION_TIERS[tier as SubscriptionTier]) {
        return res.status(400).json({ error: 'Invalid subscription tier' });
      }

      const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTier];

      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [
          {
            price: tierConfig.stripePriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId: user.id,
            tier,
          },
        },
      };
    } else if (type === 'credit_pack') {
      if (!CREDIT_PACKS[tier as keyof typeof CREDIT_PACKS]) {
        return res.status(400).json({ error: 'Invalid credit pack' });
      }

      const packConfig = CREDIT_PACKS[tier as keyof typeof CREDIT_PACKS];

      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: [
          {
            price: packConfig.stripePriceId,
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            userId: user.id,
            type: 'credit_pack',
            pack: tier,
            minutes: packConfig.minutes,
          },
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function createPortalSession(req: any, res: Response) {
  const user = req.user;

  try {
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const userId = Number(session.client_reference_id);
          const tier = subscription.metadata.tier as SubscriptionTier;

          UserModel.updateSubscription(
            userId,
            tier,
            session.customer as string,
            session.subscription as string
          );
        } else if (session.mode === 'payment') {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          const userId = Number(paymentIntent.metadata.userId);
          const minutes = Number(paymentIntent.metadata.minutes);

          // Add credit pack
          const stmt = db.prepare(`
            INSERT INTO credit_packs (user_id, minutes_purchased, minutes_remaining, stripe_payment_id)
            VALUES (?, ?, ?, ?)
          `);
          stmt.run(userId, minutes, minutes, session.payment_intent);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = Number(subscription.metadata.userId);

        if (event.type === 'customer.subscription.deleted') {
          // Downgrade to free tier
          UserModel.updateSubscription(userId, 'free');
        } else {
          const tier = subscription.metadata.tier as SubscriptionTier;
          UserModel.updateSubscription(userId, tier, subscription.customer, subscription.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        // Handle failed payment - could send email, update status, etc.
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}

export async function getPricingInfo(req: Request, res: Response) {
  res.json({
    success: true,
    tiers: Object.entries(SUBSCRIPTION_TIERS).map(([key, config]) => ({
      id: key,
      name: config.name,
      price: config.price,
      monthlyMinutes: config.monthlyMinutes,
      features: config.features,
      exportQuality: config.exportQuality,
      watermark: config.watermark,
    })),
    creditPacks: Object.entries(CREDIT_PACKS).map(([key, config]) => ({
      id: key,
      minutes: config.minutes,
      price: config.price,
    })),
  });
}
