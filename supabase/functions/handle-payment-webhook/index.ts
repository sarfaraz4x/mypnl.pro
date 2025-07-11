import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import crypto from 'https://deno.land/std@0.168.0/node/crypto.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
const webhookSecret = Deno.env.get('CASHFREE_WEBHOOK_SECRET')!;

serve(async (req) => {
  try {
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    const payload = await req.text();

    if (!signature || !timestamp) {
      throw new Error('Missing webhook headers');
    }

    // Verify the webhook signature
    const signedPayload = `${timestamp}${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('base64');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);

    // Process only successful order events
    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK' && event.data.order.order_status === 'PAID') {
      const order = event.data.order;
      const customerDetails = event.data.customer;

      // Here you would update your database
      // For example, find the user and update their subscription
      console.log(`Payment success for order: ${order.order_id}, user: ${customerDetails.customer_email}`);
      
      // Example: Update subscriptions table
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', plan_type: order.order_tags.plan_name })
        .eq('user_id', customerDetails.customer_id);

      if (error) {
        console.error('Failed to update subscription:', error);
        throw new Error('Failed to update subscription in database');
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
