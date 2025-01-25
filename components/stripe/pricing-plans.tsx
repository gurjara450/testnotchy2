'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PLANS = [
  {
    name: 'Base Plan',
    price: 500,
    priceInr: '₹500.00',
    paymentLink: 'https://buy.stripe.com/test_aEUcPJ1856ruef69AA',
    features: [
      'Basic features',
      'Limited storage',
      'Email support'
    ]
  },
  {
    name: 'Plus Plan',
    price: 1000,
    priceInr: '₹1000.00',
    paymentLink: 'https://buy.stripe.com/test_aEUcPJ1856ruef69AA', // You'll need to create another payment link for Plus plan
    features: [
      'All Base features',
      'Unlimited storage',
      'Priority support',
      'Advanced features'
    ]
  }
];

export function PricingPlans() {
  const handleUpgrade = (link: string) => {
    window.location.href = link;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      {PLANS.map((plan) => (
        <Card key={plan.name} className="p-6 flex flex-col">
          <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
          <div className="text-3xl font-bold mb-6">
            {plan.priceInr}<span className="text-lg font-normal">/month</span>
          </div>
          <ul className="mb-6 flex-grow">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center mb-2">
                <svg
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleUpgrade(plan.paymentLink)}
            className="w-full"
          >
            Upgrade to {plan.name}
          </Button>
        </Card>
      ))}
    </div>
  );
} 