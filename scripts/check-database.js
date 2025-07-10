import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://mdxskctiwpiwlzkdihdp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHNrY3Rpd3Bpd2x6a2RpaGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDQzNjMsImV4cCI6MjA2NzIyMDM2M30.82uM0hctk6qrgAqqxLkO6_IpYBeANAgL_5_gZv6BWy4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...');

    // Check if subscriptions table exists
    const { data: tables, error: tablesError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.log('❌ Subscriptions table does not exist or is not accessible');
      console.log('Error:', tablesError.message);
      console.log('\n📋 You need to apply the database migration first:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of supabase/migrations/20250101000000-add-subscriptions.sql');
      console.log('4. Execute the SQL');
      return;
    }

    console.log('✅ Subscriptions table exists');

    // Check for the specific user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('Please make sure you are logged in with sarfarazalam.sa460@gmail.com');
      return;
    }

    console.log(`👤 Found user: ${user.email}`);

    // Check user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      console.log('❌ Error fetching subscription:', subError.message);
      return;
    }

    if (subscription) {
      console.log('📊 Current subscription:');
      console.log(`   Plan Type: ${subscription.plan_type}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Start Date: ${subscription.start_date}`);
      
      if (subscription.plan_type === 'lifetime' && subscription.status === 'active') {
        console.log('🎉 User has lifetime access!');
      } else {
        console.log('❌ User does not have lifetime access');
        console.log('You need to run the grant-lifetime script with the service role key');
      }
    } else {
      console.log('❌ No subscription found for user');
      console.log('You need to run the grant-lifetime script with the service role key');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabase(); 