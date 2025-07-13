
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Infinity, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';

const Pricing = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Check if user has lifetime access
  const hasLifetimeAccess = subscription?.plan_type === 'lifetime';
  const hasPaidPlan = subscription?.plan_type === 'monthly' || subscription?.plan_type === 'yearly' || subscription?.plan_type === 'lifetime';

  // Helper function to format expiry date
  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  useEffect(() => {
    fetchUploadsCount();
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

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'One-time',
      features: [
        '20 trade uploads',
        'Basic analytics',
        'CSV/Excel export',
        'Trade journal',
      ],
      current: subscription?.plan_type === 'free',
      buttonText: subscription?.plan_type === 'free' ? 'Current Plan' : 'Current Plan',
      buttonDisabled: subscription?.plan_type === 'free',
      planType: 'free',
    },
    {
      name: 'Pro',
      price: '₹149',
      period: 'Valid for 30 days',
      features: [
        'Unlimited screenshots',
        'Advanced analytics',
        'PDF reports',
        'AI insights',
        'Priority support',
        'CSV/Excel export',
      ],
      popular: true,
      buttonText: subscription?.plan_type === 'monthly' ? 'Current Plan' : 'Upgrade Now',
      buttonDisabled: subscription?.plan_type === 'monthly',
      priceAmount: 149,
      planType: 'monthly',
    },
    {
      name: 'Pro Annual',
      price: '₹999',
      period: 'Valid for 1 year',
      features: [
        'Save ₹789 (44%)',
        'Everything in Pro',
        'Advanced filters',
        'Custom strategies',
        'Export history',
        'CSV/Excel export',
      ],
      buttonText: subscription?.plan_type === 'yearly' ? 'Current Plan' : 'Best Value',
      buttonDisabled: subscription?.plan_type === 'yearly',
      priceAmount: 999,
      planType: 'yearly',
    },
    {
      name: 'Lifetime',
      price: '₹3,999',
      period: 'One-time',
      features: [
        'Everything included',
        'Lifetime access',
        'All future updates',
        'Premium support',
        'CSV/Excel export',
        'No recurring fees',
      ],
      buttonText: subscription?.plan_type === 'lifetime' ? 'Current Plan' : 'Top Choice',
      buttonDisabled: subscription?.plan_type === 'lifetime',
      priceAmount: 3999,
      planType: 'lifetime',
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

      // Direct payment links for each plan
      const paymentLinks = {
        'Pro': 'https://payments.cashfree.com/forms/mypnl',
        'Pro Annual': 'https://payments.cashfree.com/forms/proannual',
        'Lifetime': 'https://payments.cashfree.com/forms/lifetimeplan1'
      };

      const paymentLink = paymentLinks[plan.name];
      if (paymentLink) {
        // Open payment link in new tab
        window.open(paymentLink, '_blank');
        toast({
          title: 'Payment Link Opened',
          description: 'Please complete your payment in the new tab.',
        });
      } else {
        throw new Error('Payment link not found for this plan.');
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

  const usagePercentage = Math.min((uploadsCount / 20) * 100, 100);

  if (loading || subscriptionLoading) {
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
            <span className="text-green-300 text-xs">(Never expires)</span>
          </div>
        )}
        {hasPaidPlan && !hasLifetimeAccess && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <Crown className="h-5 w-5 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-blue-400 font-semibold">
                {subscription?.plan_type === 'monthly' ? 'Monthly Plan Active' : 
                 subscription?.plan_type === 'yearly' ? 'Yearly Plan Active' : 
                 'Premium Plan Active'}
              </span>
              {subscription?.end_date && (
                <span className="text-blue-300 text-xs">
                  Expires: {formatExpiryDate(subscription.end_date)}
                </span>
              )}
            </div>
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
              <span className="text-slate-400">Trades uploaded</span>
              <span className="text-white font-semibold">
                {hasPaidPlan ? `${uploadsCount}/∞` : `${uploadsCount}/20`}
              </span>
            </div>
            <Progress value={hasPaidPlan ? 0 : usagePercentage} className="h-2" />
            {uploadsCount >= 20 && !hasPaidPlan && (
              <p className="text-red-400 text-sm mt-2">
                Upload limit reached. Upgrade to continue adding trades.
              </p>
            )}
            {hasPaidPlan && (
              <p className="text-green-400 text-sm mt-2">
                {hasLifetimeAccess ? 'Unlimited uploads with lifetime access' : 'Unlimited uploads with paid plan'}
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
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <p className="text-slate-400 text-sm">{plan.period}</p>
                {(plan.name === 'Pro' || plan.name === 'Pro Annual') && 
                  <p className="text-xs text-slate-500">(One-time)</p>
                }
                {plan.name === 'Lifetime' && hasLifetimeAccess && (
                  <div className="mt-2 inline-flex items-center space-x-1 bg-green-600/20 border border-green-500/30 rounded px-2 py-1">
                    <Star className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 text-xs font-semibold">Active</span>
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
