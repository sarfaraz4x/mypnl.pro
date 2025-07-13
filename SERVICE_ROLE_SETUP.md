# Service Role Key Setup for Admin Panel

## Quick Fix for Admin Panel

The admin panel now works without the service role key, but to see ALL users (including those who haven't subscribed yet), you need to set up the service role key.

## Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mdxskctiwpiwlzkdihdp
2. Click on **Settings** in the left sidebar
3. Click on **API** tab
4. Copy the **"service_role"** key (not the anon key)

## Step 2: Add to Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1keHNrY3Rpd3Bpd2x6a2RpaGRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NDM2MywiZXhwIjoyMDY3MjIwMzYzfQ.YourActualKeyHere
```

## Step 3: Restart Your Dev Server

After adding the environment variable:

1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again
3. The admin panel will now show ALL users

## What This Does

- **Without Service Role Key**: Shows only users who have subscription records
- **With Service Role Key**: Shows ALL authenticated users from Supabase Auth

## Security Note

⚠️ **Never commit your service role key to version control!**
- Add `.env` to your `.gitignore` file
- The service role key has elevated permissions

## Current Status

The admin panel now works in two modes:

1. **Fallback Mode** (no service role key): Shows users with subscriptions
2. **Full Mode** (with service role key): Shows all authenticated users

Both modes allow you to manage user plans and subscriptions! 