import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

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

    // Here you would typically verify the payment status with your backend.
    // For now, we'll assume if the user is redirected here, it's a success.
    // In a real app, you'd call a Supabase function to get the order status from Cashfree
    // and update the user's subscription in your database.
    
    const verifyPayment = async () => {
        // For this example, we'll just simulate a successful verification.
        // In a real implementation, you would make a call to a backend function.
        console.log(`Verifying payment for order: ${order_id}`);
        // const { data, error } = await supabase.functions.invoke('verify-payment-status', { body: { order_id } });
        // if (error) { setStatus('error'); } else { setStatus('success'); }
        setStatus('success');
    };

    verifyPayment();

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
