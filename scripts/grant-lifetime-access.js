import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://mdxskctiwpiwlzkdihdp.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function grantLifetimeAccess(email) {
  try {
    console.log(`Granting lifetime access to user: ${email}`);

    // First, find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error fetching users: ${userError.message}`);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // Check if user already has a subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Error checking existing subscription: ${subError.message}`);
    }

    if (existingSubscription) {
      // Update existing subscription to lifetime
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'lifetime',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Error updating subscription: ${updateError.message}`);
      }

      console.log('✅ Successfully updated existing subscription to lifetime access');
    } else {
      // Create new lifetime subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'lifetime',
          status: 'active',
          start_date: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Error creating subscription: ${insertError.message}`);
      }

      console.log('✅ Successfully created lifetime subscription');
    }

    console.log(`🎉 Lifetime access granted to ${email}`);
    
  } catch (error) {
    console.error('❌ Error granting lifetime access:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node grant-lifetime-access.js <email>');
  console.error('Example: node grant-lifetime-access.js sarfarazalam.sa460@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

grantLifetimeAccess(email); 