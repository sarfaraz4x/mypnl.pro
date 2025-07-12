import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge runtime variables – make sure to set these via `supabase secrets set`
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials in environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

console.log('Cashfree webhook function initialised')

serve(async (req) => {
  // Handle the test request from Cashfree, which is often a GET request.
  if (req.method === 'GET') {
    return new Response('Webhook endpoint is active. Ready for POST requests.', { status: 200 });
  }

  // This is the main handler for actual webhook notifications.
  if (req.method === 'POST') {
    try {
      const payload = await req.json()
      console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

      // Process webhook: update subscription on successful payment
      const eventType = payload.type || payload.event_type || ''
      const order = payload.data?.order ?? payload.order ?? {}

      // Different webhook payload shapes exist; normalise the required bits
      const orderStatus = order.order_status || order.status
      const customerId: string | undefined = order.customer_details?.customer_id
      const orderNote: string | undefined = order.order_note

      if (!customerId) {
        console.warn('customer_id not found in webhook payload')
      }

      // Only handle successful payments
      if (orderStatus === 'PAID') {
        const planName = orderNote?.replace('Payment for ', '') ?? 'unknown'
        const planType = planName.toLowerCase().includes('lifetime') ? 'lifetime' : planName.toLowerCase().includes('year') ? 'yearly' : 'monthly'

        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: customerId,
            plan_type: planType,
            status: 'active',
            start_date: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (error) {
          console.error('Failed to upsert subscription:', error)
          return new Response('Database error', { status: 500 })
        }
        console.log(`Subscription updated for user ${customerId} with plan ${planType}`)
      }

      // TODO: handle failed / refunded payments if needed

      // Verify the webhook signature for security (highly recommended)
      // const signature = req.headers.get('x-cashfree-signature')
      // const secret = Deno.env.get('CASHFREE_WEBHOOK_SECRET')
      // try {
      //   // Add your signature verification logic here
      // } catch (error) {
      //   console.error('Signature verification failed:', error)
      //   return new Response('Signature verification failed', { status: 401 })
      // }

      return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})

/* 
To deploy this function:
1. Make sure you have the Supabase CLI installed.
2. Login to the CLI: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`
4. Set your webhook secret: `supabase secrets set CASHFREE_WEBHOOK_SECRET=<your-secret-from-cashfree>`
5. Deploy the function: `supabase functions deploy cashfree-webhook`

After deployment, you will get a URL. Use this URL as the Endpoint URL in your Cashfree dashboard.
*/
