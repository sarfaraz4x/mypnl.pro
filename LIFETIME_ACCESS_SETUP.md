# Lifetime Access Setup Guide

This guide will help you grant lifetime access to the user with email `sarfarazalam.sa460@gmail.com`.

## Prerequisites

1. **Supabase CLI Access**: You need access to the Supabase CLI with proper authentication
2. **Service Role Key**: You need the Supabase service role key (not the anon key)

## Step 1: Apply Database Migration

The migration file `supabase/migrations/20250101000000-add-subscriptions.sql` has been created. You need to apply it to your Supabase database.

### Option A: Using Supabase CLI (Recommended)

1. **Login to Supabase CLI**:
   ```bash
   npx supabase login
   ```

2. **Link your project**:
   ```bash
   npx supabase link --project-ref mdxskctiwpiwlzkdihdp
   ```

3. **Apply the migration**:
   ```bash
   npx supabase db push
   ```

### Option B: Manual SQL Execution

If you can't use the CLI, you can manually execute the SQL in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250101000000-add-subscriptions.sql`
4. Execute the SQL

## Step 2: Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Set it as an environment variable:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

## Step 3: Grant Lifetime Access

Run the script to grant lifetime access:

```bash
npm run grant-lifetime sarfarazalam.sa460@gmail.com
```

Or run the script directly:
```bash
node scripts/grant-lifetime-access.js sarfarazalam.sa460@gmail.com
```

## Step 4: Verify the Setup

After running the script, you should see output like:
```
Granting lifetime access to user: sarfarazalam.sa460@gmail.com
Found user: [user-id] (sarfarazalam.sa460@gmail.com)
✅ Successfully created lifetime subscription
🎉 Lifetime access granted to sarfarazalam.sa460@gmail.com
```

## What This Accomplishes

1. **Database Changes**:
   - Creates a `subscriptions` table to track user access levels
   - Adds functions to check for lifetime access
   - Sets up proper Row Level Security (RLS) policies

2. **Application Changes**:
   - Updated `useUsageLimit` hook to check for lifetime access
   - Updated `Pricing` component to show lifetime access status
   - Added TypeScript types for the new subscriptions table

3. **User Experience**:
   - Users with lifetime access will have unlimited uploads
   - No usage limits will be enforced
   - A "Lifetime Access Active" badge will appear in the pricing section

## Troubleshooting

### "User not found" error
- Make sure the user has signed up with the exact email address
- Check that the email is spelled correctly

### "Permission denied" error
- Ensure you're using the service role key, not the anon key
- Verify the environment variable is set correctly

### "Database error" 
- Make sure the migration has been applied to your Supabase database
- Check that the subscriptions table exists

### CLI authentication issues
- Try running `npx supabase login` again
- Make sure you have the correct project access

## Manual Database Check

You can verify the setup worked by checking the database directly:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Look for the `subscriptions` table
4. You should see a record for the user with `plan_type = 'lifetime'` and `status = 'active'`

## Next Steps

Once the setup is complete:
1. The user will have unlimited access to all features
2. They can upload unlimited screenshots
3. All premium features will be available
4. The app will automatically detect their lifetime access status

The changes are immediate and will take effect as soon as the user refreshes the page or logs in again. 