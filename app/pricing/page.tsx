import { PricingPlans } from '@/components/stripe/pricing-plans';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600">
          Select the perfect plan for your needs
        </p>
      </div>
      <PricingPlans />
    </div>
  );
} 