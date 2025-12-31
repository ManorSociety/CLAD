/**
 * Pricing Section Component
 */

import React, { useState } from 'react';
import { SubscriptionTier, TIER_DETAILS, BillingCycle } from '../types';

interface PricingSectionProps {
  onSelectTier: (tier: SubscriptionTier, billingCycle: BillingCycle) => void;
  currentTier?: SubscriptionTier;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onSelectTier,
  currentTier
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('ANNUAL');

  const tiers = [
    SubscriptionTier.STANDARD,
    SubscriptionTier.PRO,
    SubscriptionTier.ENTERPRISE,
    SubscriptionTier.PROJECT_PASS
  ];

  const getPrice = (tier: SubscriptionTier) => {
    const details = TIER_DETAILS[tier];
    if (tier === SubscriptionTier.PROJECT_PASS) {
      return { main: '$499', sub: 'one-time' };
    }
    if (billingCycle === 'ANNUAL') {
      return { main: details.priceAnnual.replace('/mo', ''), sub: 'per month, billed annually' };
    }
    return { main: details.priceMonthly.replace('/mo', ''), sub: 'per month' };
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className={`text-sm transition-colors ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-zinc-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
          className="w-16 h-8 bg-amber-500 rounded-full relative"
        >
          <div
            className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${
              billingCycle === 'ANNUAL' ? 'right-1' : 'left-1'
            }`}
          ></div>
        </button>
        <span className={`text-sm transition-colors ${billingCycle === 'ANNUAL' ? 'text-white font-bold' : 'text-zinc-500'}`}>
          Annual <span className="text-amber-500">Save 20%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const details = TIER_DETAILS[tier];
          const price = getPrice(tier);
          const isPopular = tier === SubscriptionTier.PRO;
          const isProjectPass = tier === SubscriptionTier.PROJECT_PASS;
          const isCurrent = currentTier === tier;

          return (
            <div
              key={tier}
              className={`relative rounded-3xl p-8 space-y-6 transition-all ${
                isPopular
                  ? 'bg-zinc-900 border-2 border-amber-500/50'
                  : isProjectPass
                  ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-emerald-500/30'
                  : 'bg-zinc-900 border border-white/10'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black px-4 py-1 tracking-widest rounded-full">
                  POPULAR
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-black text-[10px] font-black px-3 py-1 tracking-widest rounded-full">
                  CURRENT
                </div>
              )}

              <div>
                <p className={`text-xs tracking-widest ${isProjectPass ? 'text-emerald-500' : isPopular ? 'text-amber-500' : 'text-zinc-500'}`}>
                  {details.name}
                </p>
                <p className="text-4xl font-serif-display mt-2">
                  {price.main}
                  {!isProjectPass && <span className="text-lg text-zinc-500">/mo</span>}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">{price.sub}</p>
              </div>

              <ul className="space-y-3">
                {details.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                    <i className={`fa-solid fa-check mt-0.5 ${isProjectPass ? 'text-emerald-500' : 'text-amber-500'}`}></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectTier(tier, billingCycle)}
                disabled={isCurrent}
                className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                  isPopular
                    ? 'bg-amber-500 text-black hover:bg-white'
                    : isProjectPass
                    ? 'bg-emerald-500 text-black hover:bg-white'
                    : 'border border-white/20 hover:bg-white hover:text-black'
                }`}
              >
                {isCurrent ? 'Current Plan' : isProjectPass ? 'Get Project Pass' : 'Select'}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ or note */}
      <p className="text-center text-xs text-zinc-600">
        All plans include free updates. Cancel anytime. Project Pass is non-refundable.
      </p>
    </div>
  );
};

export default PricingSection;
