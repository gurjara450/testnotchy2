'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const activateSubscription = async () => {
      if (!user) return;

      try {
        // Get the session_id from URL if available
        const sessionId = searchParams.get('session_id');

        // Activate the subscription
        const response = await fetch('/api/subscriptions/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            sessionId
          }),
        });

        if (!response.ok) {
          console.error('Failed to activate subscription');
        }
      } catch (error) {
        console.error('Error activating subscription:', error);
      }
    };

    activateSubscription();
  }, [user, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-green-500 mx-auto"
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
        </div>
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for upgrading your plan. Your premium features are now activated.
        </p>
        <div className="space-x-4">
          <Link href="/notebooks">
            <Button>
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/notebooks/new">
            <Button variant="outline">
              Create New Notebook
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 