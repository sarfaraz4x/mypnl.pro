import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from create-payment-order!')

serve(async (req) => {
  // This function handles OPTIONS requests which are sent by the browser
  // before the actual request to check for CORS policy.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract plan details and user info from the request body
    console.log('Processing new payment order request...');
    const { plan, user } = await req.json();
    console.log('Received plan:', plan);
    console.log('Received user:', user);

    if (!plan || !user) {
      console.error('Error: Missing plan or user details.');
      throw new Error('Missing plan or user details in the request.');
    }

    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');

    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.error('Error: Cashfree API credentials not found in environment variables.');
      throw new Error('API credentials are not configured.');
    }
    console.log('Cashfree App ID found.');

    const uniqueOrderId = `order_${user.id}_${Date.now()}`;

    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01', // Using a recent, stable version
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
      },
      body: JSON.stringify({
        order_id: uniqueOrderId,
        order_amount: plan.price,
        order_currency: 'INR',
        order_note: `Payment for ${plan.name}`,
        customer_details: {
          customer_id: user.id,
          customer_email: user.email,
          customer_phone: user.phone || '9999999999', // Use user's phone or a placeholder
        },
        order_meta: {
          return_url: `http://localhost:8080/payment-status?order_id={order_id}`,
        },
      }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error('Cashfree API request failed with status:', response.status);
      console.error('Full Cashfree API error response:', responseBody);
      throw new Error(responseBody.message || 'Failed to create payment order.');
    }

    const paymentOrder = responseBody;

    return new Response(JSON.stringify(paymentOrder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in create-payment-order function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
