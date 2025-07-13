import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Remember to set these in your Supabase project's environment variables!
const CASHFREE_CLIENT_ID = Deno.env.get('CASHFREE_CLIENT_ID')
const CASHFREE_CLIENT_SECRET = Deno.env.get('CASHFREE_CLIENT_SECRET')
const CASHFREE_API_URL = 'https://sandbox.cashfree.com/pg/orders' // Use https://api.cashfree.com/pg for production

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_amount, order_currency, customer_details, order_note } = await req.json()

    if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
      throw new Error('Missing Cashfree API credentials.')
    }

    const order_id = `order_${Date.now()}`;

    const response = await fetch(CASHFREE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2022-09-01',
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
      },
      body: JSON.stringify({
        order_id,
        order_amount,
        order_currency,
        customer_details,
        order_meta: {
          return_url: `${Deno.env.get('SUPABASE_URL')?.replace(/.co$/, '.app')}/payment-status?order_id={order_id}`,
        },
        order_note
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cashfree API error: ${errorData.message}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
