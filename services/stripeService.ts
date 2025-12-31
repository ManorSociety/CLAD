import { loadStripe, Stripe } from '@stripe/stripe-js';
import { SubscriptionTier, BillingCycle } from '../types';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const PRICE_IDS: Record<string, string> = {
  STANDARD_MONTHLY: import.meta.env.VITE_STRIPE_STANDARD_MONTHLY,
  STANDARD_ANNUAL: import.meta.env.VITE_STRIPE_STANDARD_ANNUAL,
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRO_MONTHLY,
  PRO_ANNUAL: import.meta.env.VITE_STRIPE_PRO_ANNUAL,
  ENTERPRISE_MONTHLY: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY,
  ENTERPRISE_ANNUAL: import.meta.env.VITE_STRIPE_ENTERPRISE_ANNUAL,
  PROJECT_PASS: import.meta.env.VITE_STRIPE_PROJECT_PASS,
};

export const stripeService = {
  getPriceId(tier: SubscriptionTier, billingCycle: BillingCycle): string {
    if (tier === SubscriptionTier.PROJECT_PASS) {
      return PRICE_IDS.PROJECT_PASS;
    }
    const key = `${tier}_${billingCycle}`;
    return PRICE_IDS[key] || '';
  },

  async createCheckoutSession(
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    userEmail: string,
    userId: string
  ): Promise<void> {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe not loaded');

    const priceId = this.getPriceId(tier, billingCycle);
    if (!priceId) throw new Error('Invalid price');

    const isSubscription = tier !== SubscriptionTier.PROJECT_PASS;

    // For production, you'd call your backend to create the session
    // For now, we'll use Stripe's client-side checkout
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      successUrl: `${window.location.origin}?success=true&tier=${tier}`,
      cancelUrl: `${window.location.origin}?canceled=true`,
      customerEmail: userEmail,
      clientReferenceId: userId,
    });

    if (error) throw error;
  },

  async redirectToCustomerPortal(): Promise<void> {
    // In production, call your backend to create a portal session
    window.open('https://billing.stripe.com/p/login/test', '_blank');
  }
};
