'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export type SubscriptionPlan = 'free' | 'base' | 'plus';

interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isActive: boolean;
  features: string[];
}

export function useSubscription() {
  const { user } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus>({
    plan: 'free',
    isActive: false,
    features: []
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/subscriptions/status?userId=${user.id}`);
        const data = await response.json();
        
        setStatus({
          plan: data.planType || 'free',
          isActive: data.status === 'active',
          features: data.features || []
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [user]);

  const hasFeature = (feature: string) => {
    return status.isActive && status.features.includes(feature);
  };

  const canAccessPremium = () => {
    return status.isActive && (status.plan === 'base' || status.plan === 'plus');
  };

  const canAccessPlus = () => {
    return status.isActive && status.plan === 'plus';
  };

  return {
    ...status,
    hasFeature,
    canAccessPremium,
    canAccessPlus,
  };
} 