const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantLifetimeAccess(email) {
  try {
    console.log(`\n🔍 Looking up user with email: ${email}`);
    
    // Get user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.error('❌ Error finding user:', userError.message);
      return false;
    }
    
    if (!user.user) {
      console.error('❌ User not found');
      return false;
    }
    
    console.log(`✅ Found user: ${user.user.id}`);
    
    // Check if subscription already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing subscription:', checkError.message);
      return false;
    }
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'lifetime',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user.id);
      
      if (updateError) {
        console.error('❌ Error updating subscription:', updateError.message);
        return false;
      }
      
      console.log('✅ Updated existing subscription to lifetime');
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.user.id,
          plan_type: 'lifetime',
          status: 'active',
          start_date: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error creating subscription:', insertError.message);
        return false;
      }
      
      console.log('✅ Created new lifetime subscription');
    }
    
    console.log('🎉 Lifetime access granted successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address as an argument');
    console.log('Usage: node grant-lifetime-access.js <email>');
    process.exit(1);
  }
  
  console.log('🚀 Starting lifetime access grant process...');
  
  const success = await grantLifetimeAccess(email);
  
  if (success) {
    console.log('\n✅ Process completed successfully!');
    console.log(`📧 User ${email} now has lifetime access`);
  } else {
    console.log('\n❌ Process failed');
    process.exit(1);
  }
}

main(); 