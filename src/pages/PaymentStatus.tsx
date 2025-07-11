import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const order_id = searchParams.get('order_id');
    setOrderId(order_id);

    if (!order_id) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        console.error('User not found');
        return;
      }

      // Poll the database for the subscription status
      // The webhook will update the status in the background
      const poller = setInterval(async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription status:', error);
        }

        if (data?.status === 'active') {
          setStatus('success');
          clearInterval(poller);
          clearTimeout(timeout);
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 20 seconds and show a pending message
      const timeout = setTimeout(() => {
        clearInterval(poller);
        // If status isn't success by now, show pending message
        setStatus(currentStatus => currentStatus === 'loading' ? 'pending' : currentStatus);
      }, 20000);
    };

    checkStatus();

  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <p className="text-slate-400">Verifying your payment, please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">Payment Successful!</h3>
              <p className="text-slate-400">Thank you for upgrading. Your new plan is now active.</p>
              <p className="text-xs text-slate-500">Order ID: {orderId}</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex flex-col items-center space-y-4">
              <Clock className="h-16 w-16 text-yellow-500" />
              <h3 className="text-xl font-semibold">Payment Processing</h3>
              <p className="text-slate-400">Your payment is being processed and will be updated automatically. You can safely close this page.</p>
              {orderId && <p className="text-xs text-slate-500">Order ID: {orderId}</p>}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <h3 className="text-xl font-semibold">Payment Verification Failed</h3>
              <p className="text-slate-400">There was an issue verifying your payment. Please contact support.</p>
              {orderId && <p className="text-xs text-slate-500">Order ID: {orderId}</p>}
            </div>
          )}

          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatus;
