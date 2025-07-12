import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Utility to map order amounts to plan names & types
function mapPlan(amount: number) {
  switch (amount) {
    case 99:
      return { name: 'Monthly Pro', type: 'monthly' };
    case 999:
      return { name: 'Yearly Pro', type: 'yearly' };
    case 4999:
      return { name: 'Lifetime', type: 'lifetime' };
    default:
      return { name: 'Unknown', type: 'unknown' };
  }
}

console.log('verify-payment-status function deployed ✅')

serve(async (req) => {
  // Pre-flight CORS check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('order_id is required')
    }

    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID')
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY')

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree credentials missing in environment variables')
    }

    // Fetch order details from Cashfree
    const orderRes = await fetch(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
      },
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok) {
      console.error('Cashfree order fetch failed', orderData)
      throw new Error(orderData.message || 'Failed to fetch order details')
    }

    const { order_status, order_amount, customer_details } = orderData as any

    // Only proceed if payment is successful
    if (order_status !== 'PAID') {
      return new Response(JSON.stringify({ success: false, status: order_status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Extract user id from customer_details.customer_id
    const userId = customer_details?.customer_id

    if (!userId) {
      throw new Error('User ID missing in order details')
    }

    // Map plan by amount
    const plan = mapPlan(Number(order_amount))

    // Update Supabase DB (subscriptions table)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not set')
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        plan_type: plan.type,
        plan_name: plan.name,
        status: 'active',
        order_id,
        order_amount: order_amount,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Failed to insert subscription', errBody)
      // We still send success but notify client of db error.
    }

    return new Response(
      JSON.stringify({ success: true, plan_name: plan.name, plan_type: plan.type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('verify-payment-status error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
