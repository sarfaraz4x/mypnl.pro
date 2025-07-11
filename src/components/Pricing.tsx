
import { useState, useEffect } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Infinity, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploadsCount();
    checkLifetimeAccess();
  }, []);

  const fetchUploadsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id', { count: 'exact' });

      if (error) throw error;

      setUploadsCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching uploads count:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLifetimeAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data && data.plan_type === 'lifetime') {
        setHasLifetimeAccess(true);
      }
    } catch (error) {
      console.error('Error checking lifetime access:', error);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '10 screenshot uploads',
        'Basic analytics',
        'CSV export',
        'Trade journal',
      ],
      current: true,
      buttonText: 'Current Plan',
      buttonDisabled: true,
    },
    {
      name: 'Monthly Pro',
      price: '₹99',
      period: 'month',
      features: [
        'Unlimited screenshots',
        'Advanced analytics',
        'PDF reports',
        'AI insights',
        'Priority support',
      ],
      popular: true,
      buttonText: 'Upgrade Now',
      buttonDisabled: false,
      priceAmount: 99,
    },
    {
      name: 'Yearly Pro',
      price: '₹999',
      period: 'year',
      originalPrice: '₹1,188',
      features: [
        'Everything in Monthly',
        '2 months free',
        'Advanced filters',
        'Custom strategies',
        'Export history',
      ],
      buttonText: 'Best Value',
      buttonDisabled: false,
      priceAmount: 999,
    },
    {
      name: 'Lifetime',
      price: '₹4,999',
      period: 'once',
      features: [
        'Everything included',
        'Lifetime access',
        'Future updates',
        'Premium support',
        'No recurring fees',
      ],
      buttonText: 'One-time Payment',
      buttonDisabled: false,
      priceAmount: 4999,
    },
  ];

  const handleUpgrade = async (plan: any) => {
    setIsProcessing(plan.name);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to upgrade your plan.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order', {
        body: {
          plan: {
            name: plan.name,
            price: plan.priceAmount,
          },
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone || '9999999999',
          },
        },
      });

      if (error) throw error;

      if (data.payment_session_id) {
        const cashfree = await load({ mode: 'production' });
        cashfree.checkout({ paymentSessionId: data.payment_session_id });
      } else {
        throw new Error('Failed to create payment session.');
      }
    } catch (error: any) {
      console.error('Upgrade failed:', error);
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const usagePercentage = Math.min((uploadsCount / 10) * 100, 100);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Pricing Plans</h1>
        <p className="text-slate-400">Choose the perfect plan for your trading needs</p>
        {hasLifetimeAccess && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-green-600/20 border border-green-500/30 rounded-lg px-4 py-2">
            <Star className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">Lifetime Access Active</span>
          </div>
        )}
      </div>

      {/* Current Usage */}
      <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Screenshots uploaded</span>
              <span className="text-white font-semibold">{uploadsCount}/10</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {uploadsCount >= 10 && !hasLifetimeAccess && (
              <p className="text-red-400 text-sm mt-2">
                Upload limit reached. Upgrade to continue adding trades.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`bg-slate-800 border-slate-700 relative ${
              plan.popular ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-slate-400 line-through">
                    {plan.originalPrice}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.current 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                    : plan.popular 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={plan.buttonDisabled || !!isProcessing}
                onClick={() => handleUpgrade(plan)}
>
                {isProcessing === plan.name && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing === plan.name ? 'Processing...' : plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="bg-slate-800 border-slate-700 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-white font-semibold mb-2">Can I upgrade or downgrade anytime?</h4>
            <p className="text-slate-400 text-sm">Yes, you can change your plan at any time. Changes will be reflected in your next billing cycle.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">What happens to my data if I downgrade?</h4>
            <p className="text-slate-400 text-sm">Your existing data remains safe. However, you'll be limited to the free plan restrictions for new uploads.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default Pricing;
