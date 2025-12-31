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
  CREDIT_PACK: import.meta.env.VITE_STRIPE_CREDIT_PACK,
};

export const stripeService = {
  getPriceId(tier: SubscriptionTier, billingCycle: BillingCycle): string {
    const key = `${tier}_${billingCycle}`;
    return PRICE_IDS[key] || '';
  },

  getCreditPackPriceId(): string {
    return PRICE_IDS.CREDIT_PACK;
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

    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${window.location.origin}?success=true&tier=${tier}`,
      cancelUrl: `${window.location.origin}?canceled=true`,
      customerEmail: userEmail,
      clientReferenceId: userId,
    });
    if (error) throw error;
  },

  async purchaseCreditPack(userEmail: string, userId: string): Promise<void> {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe not loaded');
    const priceId = this.getCreditPackPriceId();
    if (!priceId) throw new Error('Credit pack price not configured');

    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      successUrl: `${window.location.origin}?credits=purchased`,
      cancelUrl: `${window.location.origin}?canceled=true`,
      customerEmail: userEmail,
      clientReferenceId: userId,
    });
    if (error) throw error;
  },

  async redirectToCustomerPortal(customerId: string): Promise<void> {
    if (!customerId) {
      throw new Error('No customer ID found. Please contact support.');
    }
    
    const response = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerId,
        returnUrl: window.location.origin 
      }),
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    if (data.url) window.location.href = data.url;
  }
};
