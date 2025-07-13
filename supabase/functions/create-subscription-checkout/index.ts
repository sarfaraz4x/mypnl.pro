import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge runtime variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CASHFREE_CLIENT_ID = Deno.env.get('CASHFREE_CLIENT_ID')!
const CASHFREE_CLIENT_SECRET = Deno.env.get('CASHFREE_CLIENT_SECRET')!
const CASHFREE_ENVIRONMENT = Deno.env.get('CASHFREE_ENVIRONMENT') || 'TEST' // TEST or PROD

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Cashfree API base URL
const CASHFREE_BASE_URL = CASHFREE_ENVIRONMENT === 'PROD' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg'

// Plan configurations
const PLANS = {
  'pro_monthly': {
    plan_id: 'pro_monthly',
    plan_type: 'monthly',
    amount: 999, // ₹999
    currency: 'INR',
    interval: 'month',
    interval_count: 1
  },
  'pro_yearly': {
    plan_id: 'pro_yearly',
    plan_type: 'yearly',
    amount: 9999, // ₹9999
    currency: 'INR',
    interval: 'year',
    interval_count: 1
  },
  'lifetime': {
    plan_id: 'lifetime',
    plan_type: 'lifetime',
    amount: 19999, // ₹19999
    currency: 'INR',
    interval: 'year',
    interval_count: 1
  }
}

interface CreateSubscriptionRequest {
  plan_id: string
}

interface CashfreeCustomer {
  customer_id: string
  customer_email: string
  customer_name: string
  customer_phone: string
}

interface CashfreeSubscriptionRequest {
  subscription_id: string
  customer_id: string
  subscription_plan_id: string
  auth_amount: number
  subscription_note: string
  expires_on: string
  return_url: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request body
    const { plan_id }: CreateSubscriptionRequest = await req.json()
    
    if (!plan_id || !PLANS[plan_id]) {
      return new Response('Invalid plan_id', { status: 400 })
    }

    const plan = PLANS[plan_id]

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response('Profile not found', { status: 404 })
    }

    // Get or create Cashfree customer
    let cashfreeCustomerId = profile.cashfree_customer_id

    if (!cashfreeCustomerId) {
      // Create customer in Cashfree
      const customerData: CashfreeCustomer = {
        customer_id: user.id,
        customer_email: user.email || '',
        customer_name: profile.full_name || user.email?.split('@')[0] || 'User',
        customer_phone: '9999999999' // Default phone number
      }

      const customerResponse = await fetch(`${CASHFREE_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'x-api-version': '2025-01-01'
        },
        body: JSON.stringify(customerData)
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        console.error('Cashfree customer creation failed:', errorText)
        return new Response('Failed to create customer', { status: 500 })
      }

      const customerResult = await customerResponse.json()
      cashfreeCustomerId = customerResult.customer_id

      // Update profile with Cashfree customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          cashfree_customer_id: cashfreeCustomerId,
          cashfree_customer_email: user.email
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
      }
    }

    // Create subscription in Cashfree
    const subscriptionId = `sub_${user.id}_${Date.now()}`
    const expiresOn = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now

    const subscriptionData: CashfreeSubscriptionRequest = {
      subscription_id: subscriptionId,
      customer_id: cashfreeCustomerId,
      subscription_plan_id: plan.plan_id,
      auth_amount: plan.amount,
      subscription_note: `Subscription for ${plan.plan_type} plan`,
      expires_on: expiresOn,
      return_url: `${req.headers.get('origin') || 'http://localhost:8080'}/payment-status`
    }

    const subscriptionResponse = await fetch(`${CASHFREE_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'x-api-version': '2025-01-01'
      },
      body: JSON.stringify(subscriptionData)
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error('Cashfree subscription creation failed:', errorText)
      return new Response('Failed to create subscription', { status: 500 })
    }

    const subscriptionResult = await subscriptionResponse.json()

    // Create subscription record in database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: plan.plan_type,
        plan_id: plan.plan_id,
        cashfree_subscription_id: subscriptionId,
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (dbError) {
      console.error('Error creating subscription record:', dbError)
      return new Response('Database error', { status: 500 })
    }

    return new Response(JSON.stringify({
      success: true,
      payment_url: subscriptionResult.payment_link,
      subscription_id: subscriptionId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error in create-subscription-checkout:', error)
    return new Response('Internal server error', { status: 500 })
  }
}) 