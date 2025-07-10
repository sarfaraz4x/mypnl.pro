import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://mdxskctiwpiwlzkdihdp.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\n📋 To set it up:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mdxskctiwpiwlzkdihdp');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the "service_role" key (not the anon key)');
  console.log('4. Set it: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function grantLifetimeAccessDirect(email) {
  try {
    console.log(`🎯 Granting lifetime access to: ${email}`);

    // Find the user by email using admin API
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error fetching users: ${userError.message}`);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found. Available users:');
      users.users.forEach(u => console.log(`   - ${u.email} (${u.id})`));
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);

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
      console.log(`📊 Current subscription: ${existingSubscription.plan_type} (${existingSubscription.status})`);
      
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
    console.log('\n📱 Next steps:');
    console.log('1. Refresh your app in the browser');
    console.log('2. You should now have unlimited uploads');
    console.log('3. Check the Pricing section for "Lifetime Access Active" badge');
    
  } catch (error) {
    console.error('❌ Error granting lifetime access:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/grant-lifetime-direct.js <email>');
  console.error('Example: node scripts/grant-lifetime-direct.js sarfarazalam.sa460@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

grantLifetimeAccessDirect(email); 