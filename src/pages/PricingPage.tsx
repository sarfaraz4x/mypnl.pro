import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { load } from '@cashfreepayments/cashfree-js';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Monthly',
    price: '$10',
    amount: 10.00,
    description: 'Billed monthly',
    features: ['Access to all features', 'Monthly analytics report', 'Email support'],
  },
  {
    name: 'Yearly',
    price: '$100',
    amount: 100.00,
    description: 'Billed annually',
    features: [
      'Access to all features',
      'Annual analytics report',
      'Priority email support',
      'Save $20 per year',
    ],
  },
  {
    name: 'Lifetime',
    price: '$300',
    amount: 300.00,
    description: 'One-time payment',
    features: [
      'Access to all features',
      'Lifetime analytics',
      'Priority email support',
      'Lifetime updates',
    ],
  },
];

const PricingPage = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.name);
    try {
      const cashfree = await load({ mode: 'sandbox' }); // Use 'production' for live payments

      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          order_amount: plan.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: 'user_12345',
            customer_email: 'user@example.com',
            customer_phone: '9876543210',
            customer_name: 'Test User',
          },
          order_note: `Payment for ${plan.name} plan`,
        },
      });

      if (error) throw new Error(error.message);
      if (!data.payment_session_id) throw new Error('Failed to create payment session.');

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: data.order_meta.return_url,
      };

      cashfree.checkout(checkoutOptions);

    } catch (err: any) {
      toast.error('Payment Error', {
        description: err.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground mt-2">Simple, transparent pricing for everyone.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">{plan.price}</div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handlePayment(plan)}
                disabled={loadingPlan === plan.name}
              >
                {loadingPlan === plan.name ? 'Processing...' : 'Buy Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
