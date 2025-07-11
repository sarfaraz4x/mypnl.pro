import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('Hello from cashfree-webhook!')

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

      // IMPORTANT: Add your logic here to process the webhook event.
      // For example, you might want to update your database based on the payment status.

      // Verify the webhook signature for security (highly recommended)
      // const signature = req.headers.get('x-cashfree-signature')
      // const secret = Deno.env.get('CASHFREE_WEBHOOK_SECRET')
      // try {
      //   // Add your signature verification logic here
      // } catch (error) {
      //   console.error('Signature verification failed:', error)
      //   return new Response('Signature verification failed', { status: 401 })
      // }

      return new Response('ok', { status: 200 })
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
