# Scripts

This directory contains utility scripts for managing the MyPnL application.

## Grant Lifetime Access

To grant lifetime access to a user, you need to:

1. **Set up your Supabase Service Role Key**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "service_role" key (not the anon key)
   - Set it as an environment variable:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

2. **Run the migration** (if not already done):
   ```bash
   npx supabase db push
   ```

3. **Grant lifetime access**:
   ```bash
   npm run grant-lifetime sarfarazalam.sa460@gmail.com
   ```

   Or run the script directly:
   ```bash
   node scripts/grant-lifetime-access.js sarfarazalam.sa460@gmail.com
   ```

## What the script does:

1. Finds the user by email address
2. Checks if they already have a subscription record
3. Either updates their existing subscription to 'lifetime' or creates a new one
4. Sets the status to 'active' and plan_type to 'lifetime'

## Verification

After running the script, the user will have:
- Unlimited screenshot uploads
- No usage limits
- Access to all premium features

The user will see this reflected in the app immediately upon their next login or page refresh.

## Troubleshooting

- **User not found**: Make sure the email address is correct and the user has signed up
- **Permission denied**: Ensure you're using the service role key, not the anon key
- **Database error**: Make sure the migrations have been applied to your Supabase database 